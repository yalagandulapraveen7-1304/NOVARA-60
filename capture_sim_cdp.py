import asyncio
import json
import os
import subprocess
import tempfile
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"C:\Users\ammul\.gemini\antigravity\brain\aaa8b36d-77af-410a-9142-ddb0124d93c6"

async def send_cmd(ws, method, params=None, msg_id=1):
    msg = {"id": msg_id, "method": method}
    if params:
        msg["params"] = params
    await ws.send(json.dumps(msg))
    while True:
        resp = json.loads(await ws.recv())
        if resp.get("id") == msg_id:
            return resp

async def capture_screen(viewport_w, viewport_h, filename, wait_before=2, click_scenario=None, click_reset=False):
    temp_profile = tempfile.mkdtemp(prefix="chrome_cdp_")
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port=9222",
        f"--user-data-dir={temp_profile}",
        f"--window-size={viewport_w},{viewport_h}",
        "--hide-scrollbars",
        "--disable-gpu",
        "--no-sandbox",
        "about:blank"
    ])
    try:
        # Wait for port to become ready
        tabs = None
        for _ in range(15):
            await asyncio.sleep(0.5)
            try:
                with urllib.request.urlopen("http://127.0.0.1:9222/json") as res:
                    tabs = json.loads(res.read().decode())
                if tabs:
                    break
            except Exception:
                pass
        
        if not tabs:
            raise RuntimeError("Failed to connect to Chrome debugging port")

        ws_url = tabs[0]["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            await send_cmd(ws, "Page.enable", msg_id=1)
            await send_cmd(ws, "Emulation.setDeviceMetricsOverride", {
                "width": viewport_w,
                "height": viewport_h,
                "deviceScaleFactor": 1,
                "mobile": viewport_w < 768
            }, msg_id=2)
            
            # Navigate to site
            await send_cmd(ws, "Page.navigate", {"url": "http://localhost:3000"}, msg_id=3)
            await asyncio.sleep(3.5)

            # Open Simulation tab
            eval_res = await send_cmd(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const simBtn = buttons.find(b => b.textContent && b.textContent.trim().toUpperCase().includes('SIMULATION'));
                    if (simBtn) {
                        simBtn.click();
                        return "SIMULATION_CLICKED";
                    }
                    return "NOT_FOUND";
                })()
                """
            }, msg_id=4)
            print(f"[{filename}] Nav open eval:", eval_res.get("result", {}).get("value"))
            
            await asyncio.sleep(wait_before)

            if click_scenario:
                # Click scenario trigger button
                sc_res = await send_cmd(ws, "Runtime.evaluate", {
                    "expression": f"""
                    (() => {{
                        const cards = Array.from(document.querySelectorAll('div'));
                        const match = cards.find(d => d.textContent && d.textContent.includes('{click_scenario}'));
                        if (match) {{
                            const btn = match.querySelector('button');
                            if (btn) {{
                                btn.click();
                                return "SCENARIO_BUTTON_CLICKED";
                            }}
                        }}
                        return "SCENARIO_NOT_FOUND";
                    }})()
                    """
                }, msg_id=5)
                print(f"[{filename}] Scenario click eval:", sc_res.get("result", {}).get("value"))
                await asyncio.sleep(1.5)

            if click_reset:
                # Click reset button
                reset_res = await send_cmd(ws, "Runtime.evaluate", {
                    "expression": """
                    (() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const rBtn = buttons.find(b => b.textContent && b.textContent.includes('RESET ALL SIMULATION SCENARIOS'));
                        if (rBtn) {
                            rBtn.click();
                            return "RESET_DIALOG_OPENED";
                        }
                        return "RESET_NOT_FOUND";
                    })()
                    """
                }, msg_id=6)
                print(f"[{filename}] Reset click eval:", reset_res.get("result", {}).get("value"))
                await asyncio.sleep(1)

            # Take screenshot
            ss_res = await send_cmd(ws, "Page.captureScreenshot", {"format": "png"}, msg_id=7)
            img_b64 = ss_res["result"]["data"]
            import base64
            img_bytes = base64.b64decode(img_b64)
            out_path = os.path.join(OUTPUT_DIR, filename)
            with open(out_path, "wb") as f:
                f.write(img_bytes)
            print(f"Saved screenshot: {out_path} ({len(img_bytes)} bytes)")
    finally:
        chrome_proc.terminate()
        try:
            chrome_proc.wait(timeout=3)
        except Exception:
            chrome_proc.kill()
        import shutil
        shutil.rmtree(temp_profile, ignore_errors=True)

async def main():
    print("1. Capturing Desktop nominal state (1920x1080)...")
    await capture_screen(1920, 1080, "sim_desktop_nominal.png", wait_before=2)

    print("2. Capturing Desktop with triggered Generator 1 Failure (1920x1080)...")
    await capture_screen(1920, 1080, "sim_desktop_active_scenario.png", wait_before=2, click_scenario="Generator 1 Failure")

    print("3. Capturing Desktop with Reset Confirmation Dialog (1920x1080)...")
    await capture_screen(1920, 1080, "sim_desktop_reset_dialog.png", wait_before=2, click_reset=True)

    print("4. Capturing Tablet layout (768x1024)...")
    await capture_screen(768, 1024, "sim_tablet.png", wait_before=2)

if __name__ == "__main__":
    asyncio.run(main())
