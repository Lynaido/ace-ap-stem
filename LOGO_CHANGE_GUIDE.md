# Logo Change Guide

## Quick Summary
Replaced the brain icon (`<FaBrain />`) with a custom image logo (`logo.jpg`) in the header.

---

## Files Modified

### 1. `src/components/layout/Header.js`


**Replace icon with image:**
```javascript
// OLD:
<div className="logo-icon">
  <FaBrain />
</div>

// NEW:
<div className="logo-icon" aria-label="ACE AP STEM">
  <img
    src="/logo.jpg"
    alt="ACE AP STEM logo"
    width="36"
    height="36"
    loading="eager"
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = '/logo192.png';
    }}
  />
</div>
```

---

### 2. `src/components/layout/Header.css`

**Update `.logo-icon` (remove dark background & hover overlay):**
```css
.logo-icon {
  width: 36px;
  height: 36px;
  background: transparent;  /* Changed from dark gradient */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.logo-container:hover .logo-icon {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  transform: rotate(5deg);
}
/* Remove ::before pseudo-element completely */
```

**Add image styling:**
```css
.logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
```

---

### 3. `public/logo.jpg`

**Create:** Place your custom logo image at `public/logo.jpg`
- Size: 36x36px minimum (will be scaled to fit)
- Format: JPEG, PNG, or WebP

---

## Key Points

- ✅ Image placed in `/public` folder (served as static asset)
- ✅ Removed dark gradient background (was hiding the image)
- ✅ Removed hover overlay effect (was causing darkening)
- ✅ Added `object-fit: cover` to maintain aspect ratio
- ✅ Fallback to `logo192.png` if image missing
- ✅ Proper accessibility with `alt` text and `aria-label`

---

## Result

Logo displays cleanly with subtle shadow and rotation on hover, no darkening effect.
