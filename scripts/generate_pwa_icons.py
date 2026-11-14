import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_mission_icon(size=512, is_maskable=False):
    # Render at 2x for crisp anti-aliasing
    scale = 2
    render_size = size * scale
    img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = render_size // 2, render_size // 2
    
    # Safe zone multiplier (maskable needs 80% diameter / 10% margin on all sides)
    safe_scale = 0.76 if is_maskable else 0.92

    # 1. Background fill
    bg_color = (11, 17, 32, 255) # Deep navy #0B1120
    if is_maskable:
        draw.rectangle([0, 0, render_size, render_size], fill=bg_color)
    else:
        # Subtle rounded background or circular background
        draw.rounded_rectangle([0, 0, render_size, render_size], radius=int(render_size * 0.22), fill=bg_color)

    # 2. Cosmic nebula glow (cyan & purple/blue)
    nebula = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    ndraw = ImageDraw.Draw(nebula)
    # Radial glows
    for r in range(int(render_size * 0.5), 0, -8):
        alpha = int(45 * (1 - r / (render_size * 0.5)))
        ndraw.ellipse(
            [cx - r + int(40*scale), cy - r - int(60*scale), cx + r + int(40*scale), cy + r - int(60*scale)],
            fill=(29, 78, 216, alpha) # Blue #1D4ED8
        )
    for r in range(int(render_size * 0.35), 0, -6):
        alpha = int(60 * (1 - r / (render_size * 0.35)))
        ndraw.ellipse(
            [cx - r - int(50*scale), cy - r + int(40*scale), cx + r - int(50*scale), cy + r + int(40*scale)],
            fill=(6, 182, 212, alpha) # Cyan #06B6D4
        )
    img = Image.alpha_composite(img, nebula)
    draw = ImageDraw.Draw(img)

    # 3. Twinkling stars
    star_positions = [
        (cx - 150*scale, cy - 180*scale, 2*scale, (255, 255, 255, 220)),
        (cx + 170*scale, cy - 140*scale, 2.5*scale, (147, 197, 253, 240)),
        (cx - 200*scale, cy - 40*scale, 1.8*scale, (255, 255, 255, 180)),
        (cx + 190*scale, cy + 60*scale, 2*scale, (255, 255, 255, 200)),
        (cx - 120*scale, cy - 80*scale, 3*scale, (254, 240, 138, 255)), # gold star
        (cx + 80*scale, cy - 190*scale, 1.5*scale, (255, 255, 255, 160)),
        (cx + 130*scale, cy - 70*scale, 2.2*scale, (165, 243, 252, 220)),
        (cx - 60*scale, cy - 160*scale, 2*scale, (255, 255, 255, 190)),
        (cx + 30*scale, cy - 120*scale, 1.5*scale, (255, 255, 255, 150)),
    ]
    for sx, sy, sr, scolor in star_positions:
        sx = cx + (sx - cx) * safe_scale
        sy = cy + (sy - cy) * safe_scale
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=scolor)
        # Cross twinkle for larger stars
        if sr >= 2.5 * scale:
            draw.line([sx - sr*2, sy, sx + sr*2, sy], fill=scolor, width=max(1, int(scale)))
            draw.line([sx, sy - sr*2, sx, sy + sr*2], fill=scolor, width=max(1, int(scale)))

    # 4. Planetary surface curve (Moon / Mars horizon at bottom)
    hradius = int(240 * scale * safe_scale)
    hcy = cy + int(210 * scale * safe_scale)
    # Moon surface rim glow
    draw.ellipse(
        [cx - hradius, hcy - hradius, cx + hradius, hcy + hradius],
        fill=(30, 41, 59, 255), # slate-800
        outline=(6, 182, 212, 180), # cyan horizon glow
        width=int(3 * scale)
    )
    # Subtle craters on surface
    draw.ellipse([cx - 90*scale*safe_scale, hcy - hradius + 15*scale, cx - 60*scale*safe_scale, hcy - hradius + 35*scale], fill=(20, 27, 45, 200))
    draw.ellipse([cx + 70*scale*safe_scale, hcy - hradius + 20*scale, cx + 110*scale*safe_scale, hcy - hradius + 45*scale], fill=(20, 27, 45, 200))
    draw.ellipse([cx + 10*scale*safe_scale, hcy - hradius + 40*scale, cx + 45*scale*safe_scale, hcy - hradius + 60*scale], fill=(20, 27, 45, 200))

    # 5. Outpost Geodesic Habitat Dome
    dome_w = int(120 * scale * safe_scale)
    dome_h = int(75 * scale * safe_scale)
    dome_cy = cy + int(70 * scale * safe_scale)
    # Dome shadow / base
    draw.chord(
        [cx - dome_w, dome_cy - dome_h, cx + dome_w, dome_cy + dome_h],
        start=180, end=360,
        fill=(15, 23, 42, 240), # Dark slate interior
        outline=(56, 189, 248, 240), # Cyan dome frame
        width=int(3 * scale)
    )
    # Geodesic ribs
    for angle in [205, 230, 255, 285, 310, 335]:
        rad = math.radians(angle)
        rx = cx + math.cos(rad) * dome_w
        ry = dome_cy + math.sin(rad) * dome_h
        draw.line([cx, dome_cy, rx, ry], fill=(56, 189, 248, 140), width=int(1.8 * scale))
    # Glowing habitat observation windows
    window_pts = [
        (cx - 50*scale*safe_scale, dome_cy - 20*scale*safe_scale, 7*scale),
        (cx - 20*scale*safe_scale, dome_cy - 35*scale*safe_scale, 8*scale),
        (cx + 20*scale*safe_scale, dome_cy - 35*scale*safe_scale, 8*scale),
        (cx + 50*scale*safe_scale, dome_cy - 20*scale*safe_scale, 7*scale),
    ]
    for wx, wy, wr in window_pts:
        draw.ellipse([wx - wr, wy - wr, wx + wr, wy + wr], fill=(245, 158, 11, 255)) # Warm Artemis Gold light
        draw.ellipse([wx - wr*0.5, wy - wr*0.5, wx + wr*0.5, wy + wr*0.5], fill=(254, 240, 138, 255)) # Bright center

    # 6. Solar Panel Wings on sides of habitat
    for sign in [-1, 1]:
        sp_x1 = cx + sign * int(dome_w + 5*scale)
        sp_x2 = cx + sign * int(dome_w + 65*scale*safe_scale)
        sp_y1 = dome_cy - int(15*scale*safe_scale)
        sp_y2 = dome_cy + int(5*scale*safe_scale)
        draw.rectangle([min(sp_x1, sp_x2), sp_y1, max(sp_x1, sp_x2), sp_y2], fill=(29, 78, 216, 230), outline=(6, 182, 212, 240), width=int(1.5*scale))
        # Panel divisions
        mid_x = (sp_x1 + sp_x2) // 2
        draw.line([mid_x, sp_y1, mid_x, sp_y2], fill=(6, 182, 212, 240), width=int(1.5*scale))

    # 7. Orbital Trajectory Ellipse
    orbit_img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(orbit_img)
    or_w = int(210 * scale * safe_scale)
    or_h = int(90 * scale * safe_scale)
    odraw.ellipse(
        [cx - or_w, cy - or_h - int(30*scale*safe_scale), cx + or_w, cy + or_h - int(30*scale*safe_scale)],
        outline=(245, 158, 11, 200), # NASA Gold orbit
        width=int(2.5 * scale)
    )
    # Rotate orbit slightly
    orbit_rotated = orbit_img.rotate(-22, center=(cx, cy), resample=Image.BICUBIC)
    img = Image.alpha_composite(img, orbit_rotated)
    draw = ImageDraw.Draw(img)

    # 8. Artemis Rocket / Soaring Mission Shuttle Vector
    rx = cx
    ry = cy - int(65 * scale * safe_scale)
    rw = int(32 * scale * safe_scale)
    rh = int(95 * scale * safe_scale)

    # Rocket Flame Exhaust Plume
    flame_pts = [
        (rx, ry + rh + int(45*scale*safe_scale)),
        (rx - int(rw*0.45), ry + rh - int(5*scale)),
        (rx + int(rw*0.45), ry + rh - int(5*scale)),
    ]
    draw.polygon(flame_pts, fill=(239, 68, 68, 255)) # Red outer flame
    inner_flame = [
        (rx, ry + rh + int(30*scale*safe_scale)),
        (rx - int(rw*0.25), ry + rh - int(5*scale)),
        (rx + int(rw*0.25), ry + rh - int(5*scale)),
    ]
    draw.polygon(inner_flame, fill=(245, 158, 11, 255)) # Gold inner flame
    core_flame = [
        (rx, ry + rh + int(18*scale*safe_scale)),
        (rx - int(rw*0.12), ry + rh - int(5*scale)),
        (rx + int(rw*0.12), ry + rh - int(5*scale)),
    ]
    draw.polygon(core_flame, fill=(255, 255, 255, 255)) # White hot core

    # Rocket Body
    # Sleek aerodynamic nose and fuselage
    fuselage_pts = [
        (rx, ry), # Tip
        (rx + int(rw*0.45), ry + int(rh*0.55)),
        (rx + int(rw*0.42), ry + rh),
        (rx - int(rw*0.42), ry + rh),
        (rx - int(rw*0.45), ry + int(rh*0.55)),
    ]
    draw.polygon(fuselage_pts, fill=(248, 250, 252, 255), outline=(203, 213, 225, 255), width=int(1.5*scale))

    # Wings / Fins
    left_fin = [
        (rx - int(rw*0.42), ry + int(rh*0.65)),
        (rx - int(rw*0.95), ry + rh + int(8*scale*safe_scale)),
        (rx - int(rw*0.42), ry + rh),
    ]
    draw.polygon(left_fin, fill=(220, 38, 38, 255), outline=(248, 113, 113, 255), width=int(1.5*scale))

    right_fin = [
        (rx + int(rw*0.42), ry + int(rh*0.65)),
        (rx + int(rw*0.95), ry + rh + int(8*scale*safe_scale)),
        (rx + int(rw*0.42), ry + rh),
    ]
    draw.polygon(right_fin, fill=(220, 38, 38, 255), outline=(248, 113, 113, 255), width=int(1.5*scale))

    # Red NASA Chevron Stripe
    chevron_pts = [
        (rx, ry + int(rh*0.35)),
        (rx + int(rw*0.44), ry + int(rh*0.52)),
        (rx + int(rw*0.44), ry + int(rh*0.62)),
        (rx, ry + int(rh*0.45)),
        (rx - int(rw*0.44), ry + int(rh*0.62)),
        (rx - int(rw*0.44), ry + int(rh*0.52)),
    ]
    draw.polygon(chevron_pts, fill=(220, 38, 38, 255))

    # Cockpit Window (Cyan glowing capsule)
    cw_w = int(rw * 0.28)
    cw_y = ry + int(rh * 0.22)
    draw.ellipse([rx - cw_w, cw_y - int(8*scale*safe_scale), rx + cw_w, cw_y + int(8*scale*safe_scale)], fill=(6, 182, 212, 255), outline=(255, 255, 255, 220), width=int(1.5*scale))

    # 9. Outer Ring & Insignia Accent (for non-maskable icons)
    if not is_maskable:
        ring_r = int((render_size // 2) - 14 * scale)
        # Dual glowing border
        draw.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r], outline=(6, 182, 212, 140), width=int(3 * scale))
        ring_r2 = ring_r - int(6 * scale)
        draw.ellipse([cx - ring_r2, cy - ring_r2, cx + ring_r2, cy + ring_r2], outline=(245, 158, 11, 160), width=int(2 * scale))

    # Resize down with high quality Lanczos resampling
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img


def create_screenshots():
    # 1. Desktop / Chromebook Widescreen Screenshot (1280x720)
    w, h = 1280, 720
    d_img = Image.new("RGBA", (w, h), (11, 17, 32, 255))
    draw = ImageDraw.Draw(d_img)

    # Cosmic starfield
    for i in range(120):
        sx = (i * 73) % w
        sy = (i * 97) % h
        sr = (i % 3) + 1
        alpha = 150 + (i % 100)
        draw.ellipse([sx, sy, sx+sr, sy+sr], fill=(255, 255, 255, alpha))

    # Top header bar
    draw.rectangle([0, 0, w, 64], fill=(15, 23, 42, 240), outline=(6, 182, 212, 120), width=1)
    draw.text((28, 22), "OUTPOST COMMANDER : JUNIOR ASTRONAUT CONSOLE", fill=(6, 182, 212, 255))
    draw.text((w - 240, 22), "SOL 04 / 10 | DSN LINK: ONLINE", fill=(52, 211, 153, 255))

    # Visualizer diorama panel (Left 60%)
    draw.rounded_rectangle([28, 88, 760, 680], radius=16, fill=(15, 23, 42, 200), outline=(56, 189, 248, 100), width=2)
    draw.text((48, 108), "HABITAT 3D TELEMETRY & REGOLITH SHIELDING", fill=(148, 163, 184, 255))
    # Simulated habitat visual
    hcx, hcy = 394, 380
    draw.chord([hcx-180, hcy-110, hcx+180, hcy+110], start=180, end=360, fill=(30, 41, 59, 255), outline=(6, 182, 212, 255), width=3)
    draw.rectangle([hcx-240, hcy-30, hcx-180, hcy], fill=(29, 78, 216, 255), outline=(56, 189, 248, 255))
    draw.rectangle([hcx+180, hcy-30, hcx+240, hcy], fill=(29, 78, 216, 255), outline=(56, 189, 248, 255))
    draw.text((hcx - 90, hcy + 50), "LUNAR SOUTH POLE - SHACKLETON CRATER", fill=(245, 158, 11, 255))

    # Control Deck panel (Right 35%)
    draw.rounded_rectangle([784, 88, 1252, 680], radius=16, fill=(15, 23, 42, 200), outline=(56, 189, 248, 100), width=2)
    draw.text((808, 108), "TACTILE POWER ALLOCATION (100 MW BUDGET)", fill=(245, 158, 11, 255))

    subsystems = [
        ("Life Support & Oxygen", "35 MW", (52, 211, 153, 255), 0.7),
        ("Regolith Heat & Thermal", "25 MW", (245, 158, 11, 255), 0.5),
        ("Radiation Deflector Shield", "25 MW", (6, 182, 212, 255), 0.5),
        ("ISRU Water & Fuel Production", "15 MW", (168, 85, 247, 255), 0.3),
    ]
    sy = 160
    for name, mw, color, pct in subsystems:
        draw.text((808, sy), name, fill=(226, 232, 240, 255))
        draw.text((1180, sy), mw, fill=color)
        draw.rounded_rectangle([808, sy+28, 1228, sy+42], radius=7, fill=(30, 41, 59, 255))
        draw.rounded_rectangle([808, sy+28, int(808 + 420 * pct), sy+42], radius=7, fill=color)
        sy += 75

    # Bottom commit button simulation
    draw.rounded_rectangle([808, 590, 1228, 650], radius=12, fill=(29, 78, 216, 255), outline=(6, 182, 212, 255), width=2)
    draw.text((950, 610), "COMMENCE SOL 04 SIMULATION", fill=(255, 255, 255, 255))

    d_img.save("public/icons/screenshot-desktop.png", "PNG")
    print("Saved public/icons/screenshot-desktop.png")

    # 2. Mobile / Tablet Screenshot (750x1334)
    mw, mh = 750, 1334
    m_img = Image.new("RGBA", (mw, mh), (11, 17, 32, 255))
    mdraw = ImageDraw.Draw(m_img)

    for i in range(90):
        sx = (i * 61) % mw
        sy = (i * 113) % mh
        sr = (i % 3) + 1
        mdraw.ellipse([sx, sy, sx+sr, sy+sr], fill=(255, 255, 255, 180))

    # Mobile Header
    mdraw.rectangle([0, 0, mw, 80], fill=(15, 23, 42, 240), outline=(6, 182, 212, 120), width=1)
    mdraw.text((24, 30), "OUTPOST COMMANDER", fill=(6, 182, 212, 255))
    mdraw.text((mw - 190, 30), "SOL 02 / 10", fill=(52, 211, 153, 255))

    # Mobile Habitat Card
    mdraw.rounded_rectangle([24, 100, mw - 24, 520], radius=16, fill=(15, 23, 42, 200), outline=(56, 189, 248, 100), width=2)
    mdraw.text((44, 120), "ARTEMIS LUNAR BASECAMP", fill=(245, 158, 11, 255))
    # Dome visual
    m_cx, m_cy = mw // 2, 330
    mdraw.chord([m_cx-140, m_cy-80, m_cx+140, m_cy+80], start=180, end=360, fill=(30, 41, 59, 255), outline=(6, 182, 212, 255), width=3)
    mdraw.rectangle([m_cx-190, m_cy-20, m_cx-140, m_cy+5], fill=(29, 78, 216, 255))
    mdraw.rectangle([m_cx+140, m_cy-20, m_cx+190, m_cy+5], fill=(29, 78, 216, 255))
    mdraw.text((m_cx - 95, 450), "CREW HEALTH: 96% | POWER: 100 MW", fill=(52, 211, 153, 255))

    # Mobile Sliders Card
    mdraw.rounded_rectangle([24, 545, mw - 24, 1180], radius=16, fill=(15, 23, 42, 200), outline=(56, 189, 248, 100), width=2)
    mdraw.text((44, 565), "TACTILE POWER CONTROLS", fill=(245, 158, 11, 255))

    msy = 620
    for name, mw_val, color, pct in subsystems:
        mdraw.text((44, msy), name, fill=(226, 232, 240, 255))
        mdraw.text((mw - 130, msy), mw_val, fill=color)
        mdraw.rounded_rectangle([44, msy+30, mw - 44, msy+52], radius=11, fill=(30, 41, 59, 255))
        mdraw.rounded_rectangle([44, msy+30, int(44 + (mw - 88) * pct), msy+52], radius=11, fill=color)
        msy += 115

    # Mobile Action Button
    mdraw.rounded_rectangle([24, 1205, mw - 24, 1295], radius=14, fill=(29, 78, 216, 255), outline=(6, 182, 212, 255), width=2)
    mdraw.text((mw // 2 - 110, 1240), "COMMIT POWER ALLOCATION", fill=(255, 255, 255, 255))

    m_img.save("public/icons/screenshot-mobile.png", "PNG")
    print("Saved public/icons/screenshot-mobile.png")


def main():
    os.makedirs("public/icons", exist_ok=True)
    
    # 1. Standard Icons
    print("Generating standard icons...")
    icon_512 = create_mission_icon(size=512, is_maskable=False)
    icon_512.save("public/icons/icon-512.png", "PNG")
    print("Saved public/icons/icon-512.png")

    icon_192 = create_mission_icon(size=192, is_maskable=False)
    icon_192.save("public/icons/icon-192.png", "PNG")
    print("Saved public/icons/icon-192.png")

    # 2. Maskable Icons (safe padding for Android / ChromeOS adaptive icons)
    print("Generating maskable icons...")
    maskable_512 = create_mission_icon(size=512, is_maskable=True)
    maskable_512.save("public/icons/icon-maskable-512.png", "PNG")
    print("Saved public/icons/icon-maskable-512.png")

    maskable_192 = create_mission_icon(size=192, is_maskable=True)
    maskable_192.save("public/icons/icon-maskable-192.png", "PNG")
    print("Saved public/icons/icon-maskable-192.png")

    # 3. Apple Touch Icon (180x180 for iPads & iPhones)
    print("Generating Apple touch icon...")
    apple_icon = create_mission_icon(size=180, is_maskable=False)
    apple_icon.save("public/icons/apple-touch-icon.png", "PNG")
    print("Saved public/icons/apple-touch-icon.png")

    # 4. Favicons
    fav_32 = icon_192.resize((32, 32), Image.Resampling.LANCZOS)
    fav_32.save("public/icons/favicon-32.png", "PNG")
    fav_16 = icon_192.resize((16, 16), Image.Resampling.LANCZOS)
    fav_16.save("public/icons/favicon-16.png", "PNG")
    print("Saved favicons")

    # 5. Screenshots
    print("Generating PWA screenshots...")
    create_screenshots()
    print("All PWA assets successfully generated!")

if __name__ == "__main__":
    main()
