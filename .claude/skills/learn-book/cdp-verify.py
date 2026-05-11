#!/usr/bin/env python3
"""
CDP runtime verifier for /learn-book chapters.

Connects to a headless Chrome at 127.0.0.1:9222, navigates to the given URL,
listens for Pyodide exceptions for WAIT seconds, then exits.

Exit codes:
  0 — clean run (no exceptions)
  1 — one or more exceptions captured
  2 — could not connect to Chrome (likely Chrome not running on 9222)

Usage:
  python3 cdp-verify.py <url> [--wait SECONDS]

Requires:
  pip install websockets
"""
import argparse
import asyncio
import json
import sys
import urllib.request
import urllib.error

try:
    import websockets
except ImportError:
    print("cdp-verify: need `pip install websockets`", file=sys.stderr)
    sys.exit(2)


def get_target_ws() -> str:
    data = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=2))
    page = next(t for t in data if t["type"] == "page")
    return page["webSocketDebuggerUrl"]


async def run(url: str, wait: int) -> int:
    try:
        ws_url = get_target_ws()
    except (urllib.error.URLError, OSError, StopIteration) as exc:
        print(f"cdp-verify: cannot reach Chrome on 9222: {exc}", file=sys.stderr)
        return 2

    print(f"[cdp] connecting {ws_url}", file=sys.stderr)
    async with websockets.connect(ws_url, max_size=64 * 1024 * 1024) as ws:
        next_id = [1]

        async def send(method, params=None):
            i = next_id[0]
            next_id[0] += 1
            await ws.send(json.dumps({"id": i, "method": method, "params": params or {}}))
            return i

        await send("Runtime.enable")
        await send("Log.enable")
        await send("Page.enable")
        await send("Page.navigate", {"url": url})

        loop = asyncio.get_event_loop()
        end = loop.time() + wait
        errors = []
        while loop.time() < end:
            remaining = max(0.1, min(5.0, end - loop.time()))
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=remaining)
            except asyncio.TimeoutError:
                continue
            data = json.loads(msg)
            method = data.get("method", "")
            params = data.get("params", {})
            if method == "Runtime.exceptionThrown":
                ed = params.get("exceptionDetails", {})
                text = ed.get("text", "")
                desc = ed.get("exception", {}).get("description", "")
                errors.append(f"[EXCEPTION] {text}\n  {desc[:1500]}")
                print(errors[-1])
            elif method == "Runtime.consoleAPICalled":
                if params.get("type") == "error":
                    args = params.get("args", [])
                    txt = " ".join(a.get("value", a.get("description", "")) or "" for a in args)
                    errors.append(f"[console.error] {txt[:1500]}")
                    print(errors[-1])

        print(f"[cdp] done; {len(errors)} exceptions captured", file=sys.stderr)
        return 1 if errors else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--wait", type=int, default=90, help="seconds to listen for errors")
    args = ap.parse_args()
    rc = asyncio.run(run(args.url, args.wait))
    sys.exit(rc)


if __name__ == "__main__":
    main()
