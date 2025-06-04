# Calculation of the hiking estimate

Implement a hiking time calculator using Naismith's Rule as a base.

For that, we should have two numerical inputs: 
- Distance in miles
- Vertical gain in feet

Let's use 20 minutes per mile as the speed for our Naismith's base calculation.
2000 feet of vertical gain is equivalent to an additional 3 miles in distance.

We also should apply a correction in % over it.
To calculate this correction, let's ask for two more categorical inputs:

1. Terrain Type. Supported values are
    1. Flat: -10%
    2. Backcountry: +0% - default
    3. Hilly: +10%
    4. Mountainous: +20%
2. Packing Weight. Supported values are
    1. Light (7% body weight): +0% - default
    2. Moderate (14% body weight): +20%
    3. Heavy (20% body weight): +40%
    4. Very Heavy (25%+ body weight): +60%

To calculate the final correction %, we should sum the corrections for each of the three inputs.

One more correction that we apply should be for taking breaks. 
Let's add the additional 10 minutes for every hour of hiking time to get the final result.

The outputs are: Naismith's estimate, correction %, breaks time, final corrected estimate.

# Standalone UI

First, UI should have the two numerical inputs.

Categorical inputs should be implemented as adjacent buttons for an easy selection, one button for each value.
These buttons should be sorted by the correction value, from the lowest to the highest.
Categorical inputs should be displayed below the numerical inputs.

Under the inputs, UI should display the final calculated time in hours and minutes, rounded to the nearest minute.
It should also display the base Naismith's estimate and the final correction %.
Calculated values should be updated automatically and displayed when a user changes any of the inputs.

Default prepopulated value for:
- distance: 5 miles, 
- vertical gain: 1000 feet.

### Mode toggle
Above the categorical inputs, there should be a toggle to switch between "Day Hike" and "Backpacking" modes.
"Day Hike" mode is equivalent to the "Backcountry" terrain type and "Light" packing weight.
"Backpacking" mode is equivalent to the "Hilly" terrain type and "Heavy" packing weight.
The toggle should have three states: 
- "Day Hike" (to the left) selected
- "Backpacking" (to the right) selected
- None selected for a "Custom" mode
and be represented as a green horizontal switch.
A user should be able to use the toggle to go into "Day Hike" or "Backpacking" mode. Toggle is getting 
switched to "Custom" (none selected) automatically when the user selects a combination of 
categorical inputs that doesn't match these two mods.

When a user selects a mode with the toggle, the categorical inputs should change to the corresponding values.
When a user selects categorical inputs in a way that doesn't match any mode, the mode toggle should go into 
"Custom" state.

## LLM Instructions
- Math javascript code that implements the calculations should be
in a file named `hiking-time-calculator.js`.

- `hiking-time-calculator.html` with the UI. UI JS code should be in this file, not in `hiking-time-calculator.js`

# Chrome Plugin

## Purpose

Implement a Chrome plugin that displays hiking time estimates next to route info on a web page.
It should use code from `hiking-time-calculator.js` to calculate the estimates.
Below are the examples of the HTML divs that should be detected to display the hiking time estimates.
Distance and Ascent values should be extracted from such divs.

## Example of a div on a Route Editing Page

```html
<div class="EditRoute-module__controls--c1ONO"><button class="ChooseActivity-module__button--uedMb" aria-label="Hiking"><svg viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.25 26.325C2.25 27.1407 2.25 30.9375 2.25 30.9375H6.75L7.425 29.85L8.25 30.9375H9.75L10.875 29.85L11.625 30.9375C12.1631 30.3695 12.6087 28.6875 13.5 28.6875H16.5C17.4887 28.6875 18.1975 30.3651 18.9 30.9375L19.575 30L21 30.9375H21.75L22.875 30L24 30.9375H24.75L26.1 29.925L26.775 30.9375C27.225 30.8625 27.75 30.525 28.2 30.45L29.175 29.475L29.7 30.075C30.075 29.925 30.525 29.775 30.9 29.625C30.9 29.625 32.9625 28.575 33.9375 27.675V24" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8.70044 8.0625H2.25035L2.25 26.4375H9.74997C11.0509 26.4375 11.4899 24.9375 12.75 24.9375H16.5C18.3947 24.9375 18.5066 26.4375 20.25 26.4375C22.4281 26.4375 27 26.4375 27 26.4375L33.6754 23.775C33.6754 23.775 32.025 18.825 26.25 21C26.25 21 17.475 18 15.75 14.25L15.75 5.0625H11.1754C9.8254 5.0625 8.70044 6.8625 8.70044 8.0625Z" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.9756 10.1249C15.9756 10.1249 17.2506 8.47494 18.9006 9.59994C20.0256 10.3499 19.2006 11.7749 16.0506 11.2499" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2.25 21.5641L8.25 21.5642C9.31855 21.5642 10.0844 21.4928 10.5 22.3142L11.25 23.625" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M26.25 21V24.375" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 12.5625H2.25" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.1504 10.3501H12.9004" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.1504 13.3125H12.9004" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16.3492 15.6001L14.6992 17.3251" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5992 17.3999L16.9492 19.1999" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21.1492 18.8999L19.5742 20.6999" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M23.8492 20.3999L22.1992 22.1999" stroke="currentColor" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path></svg></button><div class="Stats-module__stats--KW1GI"><div><p>8.6 <span>mi</span></p></div><div><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-7j8jl" focusable="false" color="#ACACAE" aria-hidden="true" viewBox="0 0 24 24"><path d="m4 12 1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8z"></path></svg><p>1,734 <span>ft</span></p></div><div><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-7j8jl" focusable="false" color="#ACACAE" aria-hidden="true" viewBox="0 0 24 24"><path d="m20 12-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8z"></path></svg><p>437 <span>ft</span></p></div></div><div class="EditRoute-module__routeTitle--aneHj"><div aria-label="Change Color" class="MuiInputBase-root MuiInput-root MuiInputBase-colorPrimary MuiSelect-root css-w44391"><div tabindex="0" role="combobox" aria-expanded="false" aria-haspopup="listbox" class="MuiSelect-select MuiSelect-standard MuiInputBase-input MuiInput-input css-1wcjd45" style="border-radius: 4px; padding: 8px;"><div style="position: relative; height: 24px; width: 24px; background-color: rgb(87, 38, 194); border-radius: 4px;"></div></div><input aria-invalid="false" aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput css-147e5lo" value="#5726C2"></div><h4 class="MuiTypography-root MuiTypography-h4 css-48q68v" aria-label="Banff - day 4">Banff - day 4</h4><button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-colorPrimary MuiIconButton-sizeMedium css-czf5nk" tabindex="0" type="button" aria-label="Edit"><svg width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.708 3.39937C15.1755 2.86688 14.3121 2.86688 13.7796 3.39937L3.39939 13.7796C3.14367 14.0353 3 14.3822 3 14.7438V17.6364C3 18.3895 3.6105 18.9999 4.36358 18.9999H7.25614C7.61779 18.9999 7.96461 18.8563 8.22033 18.6006L18.6006 8.22038C19.1331 7.68787 19.1331 6.82452 18.6006 6.29201L15.708 3.39937ZM7.2552 17.6364H4.36257V14.7438L12.3864 6.71991L15.279 9.61249L7.2552 17.6364ZM16.279 8.61249L17.6354 7.25611L14.7428 4.36355L13.3864 5.71991L16.279 8.61249Z" fill="#2F7844"></path></svg></button></div><div aria-label="Graph Style" class="MuiInputBase-root MuiInput-root MuiInputBase-colorPrimary MuiSelect-root css-sj39ut"><div tabindex="0" role="combobox" aria-expanded="false" aria-haspopup="listbox" class="MuiSelect-select MuiSelect-standard MuiInputBase-input MuiInput-input css-1wcjd45" style="border-radius: 4px; padding: 0px; color: rgb(96, 97, 99); background-color: transparent;"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M11.25 9C11.25 5.27208 14.2721 2.25 18 2.25H30C33.7279 2.25 36.75 5.27208 36.75 9V39C36.75 42.7279 33.7279 45.75 30 45.75H18C14.2721 45.75 11.25 42.7279 11.25 39V9ZM18 3.75C15.5313 3.75 13.4605 5.45399 12.8997 7.75H35.1003C34.5395 5.45399 32.4687 3.75 30 3.75H18ZM12.75 36.25V9.25H35.25V36.25H12.75ZM12.75 37.75V39C12.75 41.8995 15.1005 44.25 18 44.25H30C32.8995 44.25 35.25 41.8995 35.25 39V37.75H12.75ZM30.75 15C30.75 14.5858 30.4142 14.25 30 14.25C29.5858 14.25 29.25 14.5858 29.25 15V32C29.25 32.4142 29.5858 32.75 30 32.75C30.4142 32.75 30.75 32.4142 30.75 32V15ZM25.25 19L25.25 32C25.25 32.4142 25.5858 32.75 26 32.75C26.4142 32.75 26.75 32.4142 26.75 32L26.75 19C26.75 18.5858 26.4142 18.25 26 18.25C25.5858 18.25 25.25 18.5858 25.25 19ZM21.25 32V23C21.25 22.5858 21.5858 22.25 22 22.25C22.4142 22.25 22.75 22.5858 22.75 23V32C22.75 32.4142 22.4142 32.75 22 32.75C21.5858 32.75 21.25 32.4142 21.25 32ZM17.25 27V32C17.25 32.4142 17.5858 32.75 18 32.75C18.4142 32.75 18.75 32.4142 18.75 32L18.75 27C18.75 26.5858 18.4142 26.25 18 26.25C17.5858 26.25 17.25 26.5858 17.25 27ZM24.5 41C24.5 41.2761 24.2761 41.5 24 41.5C23.7239 41.5 23.5 41.2761 23.5 41C23.5 40.7239 23.7239 40.5 24 40.5C24.2761 40.5 24.5 40.7239 24.5 41ZM26 41C26 42.1046 25.1046 43 24 43C22.8954 43 22 42.1046 22 41C22 39.8954 22.8954 39 24 39C25.1046 39 26 39.8954 26 41Z"></path></svg></div><input aria-invalid="false" aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput css-147e5lo" value=""></div><div class="EditRoute-module__routeControls--jh0Wz"><div class="EditRoute-module__routeControlsGroup--V_ShM"><span aria-label="Back to start (B)" class=""><button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall css-lz5g3z" tabindex="0" type="button" aria-label="Back to Start" aria-keyshortcuts="b"><svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.9942 16.0395L14.5453 17.3906L9.03711 11.8824L14.668 6.25146L16.0941 7.62543L12.8371 10.8824L22.0371 10.8824V12.8824L12.8371 12.8824L15.9942 16.0395Z" fill="currentcolor"></path><path d="M7 12C7 13.6569 5.65685 15 4 15C2.34315 15 1 13.6569 1 12C1 10.3432 2.34315 9.00001 4 9.00001C5.65685 9.00001 7 10.3432 7 12Z" fill="currentcolor"></path></svg></button></span><span aria-label="Out and back (O)" class=""><button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall css-lz5g3z" tabindex="0" type="button" aria-label="out and back" aria-keyshortcuts="o"><svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8H20" stroke="currentColor" stroke-width="2"></path><path d="M17 16H4" stroke="currentColor" stroke-width="2"></path><path d="M17 4L21 8L17 12" stroke="currentColor" stroke-width="2"></path><path d="M7 20L3 16L7 12" stroke="currentColor" stroke-width="2"></path></svg></button></span><span aria-label="Reverse route (R)" class=""><button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall css-lz5g3z" tabindex="0" type="button" aria-label="reverse route" aria-keyshortcuts="r"><svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 16.4833L10.4865 18L4 11.5L10.4865 5L12 6.51667L7.02703 11.5L12 16.4833Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M20 16.4833L18.4865 18L12 11.5L18.4865 5L20 6.51667L15.027 11.5L20 16.4833Z" fill="currentColor"></path></svg></button></span></div><div class="MuiDivider-root MuiDivider-fullWidth MuiDivider-vertical css-q2gd0r" role="separator" aria-orientation="vertical"></div><div class="EditRoute-module__routeControlsGroup--V_ShM"><span aria-label="Undo (Ctrl+Z)" class=""><button class="MuiButtonBase-root Mui-disabled MuiIconButton-root Mui-disabled MuiIconButton-sizeSmall css-lz5g3z" tabindex="-1" type="button" disabled="" aria-label="undo" aria-keyshortcuts="meta+u"><svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 13.2856C20 8.88564 16.4 5.28564 12 5.28564C9.8 5.28564 7.8 6.28564 6 7.28564L4 5.28564V12.2856L11 12.2856L8 9.28564C8.9 7.98564 10.3 7.28564 12 7.28564C15.3 7.28564 18 9.98564 18 13.2856C18 14.8492 17.3939 16.278 16.4051 17.3488L17.863 18.7145C19.1876 17.2855 20 15.3758 20 13.2856Z" fill="currentColor"></path></svg></button></span><span aria-label="Redo (Ctrl+Y)" class=""><button class="MuiButtonBase-root Mui-disabled MuiIconButton-root Mui-disabled MuiIconButton-sizeSmall css-lz5g3z" tabindex="-1" type="button" disabled="" aria-label="redo" aria-keyshortcuts="meta+y"><svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 13.2856C4 8.88564 7.6 5.28564 12 5.28564C14.2 5.28564 16.2 6.28564 18 7.28564L20 5.28564V12.2856L13 12.2856L16 9.28564C15.1 7.98564 13.7 7.28564 12 7.28564C8.7 7.28564 6 9.98564 6 13.2856C6 14.8492 6.6061 16.278 7.59494 17.3488L6.13704 18.7145C4.8124 17.2855 4 15.3758 4 13.2856Z" fill="currentColor"></path></svg></button></span></div><div class="MuiDivider-root MuiDivider-fullWidth MuiDivider-vertical css-q2gd0r" role="separator" aria-orientation="vertical"></div></div><div class="EditRoute-module__buttons--bTcum"><button class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textNeutral MuiButton-sizeSmall MuiButton-textSizeSmall MuiButton-colorNeutral MuiButton-root MuiButton-text MuiButton-textNeutral MuiButton-sizeSmall MuiButton-textSizeSmall MuiButton-colorNeutral css-1xo3xba" tabindex="0" type="button">Cancel</button><button class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-colorPrimary Mui-disabled MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-colorPrimary css-16733dr" tabindex="-1" type="button" disabled="">Save</button></div><div class="MuiDivider-root MuiDivider-fullWidth MuiDivider-vertical css-q2gd0r" role="separator" aria-orientation="vertical"></div><button class="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeSmall MuiButton-outlinedSizeSmall MuiButton-colorPrimary MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeSmall MuiButton-outlinedSizeSmall MuiButton-colorPrimary css-ymcpwh" tabindex="0" type="button" aria-label="Old Editor" style="block-size: 29px; min-width: auto;"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" width="19" height="19"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 3C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V14V13H19V14V19H5V5H10H11V3H10H4ZM14 5H17.5858L10.2929 12.2929L11.7071 13.7071L19 6.41421V10H21V4V3H20H14V5Z" fill="currentColor"></path></svg></button></div>
```

This `div` displays distance of 8.6 miles, Ascent of 1,734 feet, and Descent of 437 feet.
Display an estimate in a format of `⏱ hh:mm` to the right from the Descent div.
Mimic the style of the Descent div.
Use #ACACAE `⏱` for the `⏱` icon and simple `<p>` tag for `hh:mm` text.

## Example of a div on a Route Summary Page
```html
<div class="TrackDetailsSidebar-module__trackStatsContainer--tQ5rv"><div style="display: flex; gap: 16px;"><div><span class="SummaryTrackStat-module__statLabel--g0_e7">Distance</span><p class="MuiTypography-root MuiTypography-body1 SummaryTrackStat-module__stat--wJ0VF css-5c2nyf">9.56<span class="SummaryTrackStat-module__statLabel--g0_e7"> mi</span></p></div><div><span class="SummaryTrackStat-module__statLabel--g0_e7">Ascent</span><p class="MuiTypography-root MuiTypography-body1 SummaryTrackStat-module__stat--wJ0VF css-5c2nyf">3,849<span class="SummaryTrackStat-module__statLabel--g0_e7"> ft</span></p></div></div></div>
```

This `div` displays distance of 9.56 miles, and ascent of 3,849 feet.
Display an estimate in a format of `Duration` label above with time in `hh:mm` format below.
Display it to the right of the Ascent div.
Make it a separate div.
Mimic the style of the Ascent div.
Use `SummaryTrackStat-module__statLabel--g0_e7` CSS class for the label.
Use `SummaryTrackStat-module__stat--wJ0VF` and `css-5c2nyf` CSS classes for the time, also use 18px font size.

## Example of a div on a Route Sharing Page
```html
<div class="Card-module__card--iAbp1"><div class="Card-module__cardHeader--KHysE"><h2 class="Card-module__cardHeaderTitle--TW_Do">STATS</h2></div><div class="Card-module__cardContent--TAWgB"><div class="Stats-module__statsItem--DlArF"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium Stats-module__statsItemIcon--cZqyj css-7j8jl" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M19.71 9.71 22 12V6h-6l2.29 2.29-4.17 4.17c-.39.39-1.02.39-1.41 0l-1.17-1.17c-1.17-1.17-3.07-1.17-4.24 0L2 16.59 3.41 18l5.29-5.29c.39-.39 1.02-.39 1.41 0l1.17 1.17c1.17 1.17 3.07 1.17 4.24 0z"></path></svg><div class="Stats-module__statsItemText--OKrSu"><div class="Stats-module__statsItemTextValue--DE1cK">9.26 mi</div><div class="Stats-module__statLabel--Jk4cC">Distance</div></div></div><hr class="MuiDivider-root MuiDivider-fullWidth Stats-module__divider--Zmg4s css-1wh3qu1"><div class="Stats-module__statsInfo--jbi9I"><ul><li><strong>1,107 ft</strong><div class="Stats-module__statLabel--Jk4cC">Ascent</div></li><li><strong>596 ft</strong><div class="Stats-module__statLabel--Jk4cC">Descent</div></li></ul></div></div></div>
```
This `div` displays distance of 9.26 miles, Ascent of 1,107 feet, and Descent of 596 feet.
There may be several such divs on the page, find the one that has a title `STATS`, like this example.
Display an estimate as a time in `hh:mm` format above and `Duration` label below.
Display it to the right of the Descent `li` element.
Make it a separate `li` element.
Mimic the style of the Descent `li` element.
Use `Stats-module__statLabel--Jk4cC` CSS class for the label.

## Estimation Configuration Popup
When a user clicks on the plugin icon in the Chrome toolbar, it should open a small window with the following options:
1. Terrain Type. Supported values are
   1. Flat
   2. Backcountry
   3. Hilly
   4. Mountainous:
2. Packing Weight. Supported values are
   1. Light (7% body weight)
   2. Moderate (14% body weight)
   3. Heavy (20% body weight)
   4. Very Heavy (25%+ body weight)
      These inputs should be implemented as adjacent buttons for an easy selection, one button for each value.
      These values should be used and sent as Terrain Type and Packing Weight parameters to the `hiking-time-calculator.js` code for the calculations.
      It should use `Backcountry` as a default Terrain Type and `Moderate` as a default Packing Weight.
      There should be no "Settings saved" or other messages like that appearing when user changes settings.

Above the options, this popup should have a Mode Toggle, representing the current configuration and allowing user
to switch between "Day Hike" and "Backpacking" modes.

When a user changes anything in the configuration popup, the displayed estimates 
and details in the hover tooltip should be immediately updated accordingly.

When the configuration window popup opens, it should read the current configuration from the page and 
set the toggle and inputs accordingly before rendering them.
So the users don't see UI elements changing from their default state immediately after opening the popup.

## Hover

Hover over the added divs with the estimates should display the tooltip with the calculation breakdown.
This should work on all divs with the duration estimates that we add in this plugin.
The tooltip should display the following information (preserve tabulation, make sure css styles are rendering tabs correctly):
```
Base Naismith's time: hh:mm 
<tab>M mi distance: hh:mm
<tab>N fi ascent: hh:mm
Mode: <Day Hike / Backpacking / Custom>
<tab>Terrain correction: X%
<tab>Pack weight correction: Y%
Breaks time: hh:mm
Final estimated hiking time: hh:mm
```
The tooltip background should be white with black font. Give it rounded corners (6px border radius) with a 2px shade.
The tooltip should have the Mode Toggle at the bottom, representing the current configuration and allowing user
to switch between "Day Hike" and "Backpacking" modes. 
The result of switching the toggle should be reflected in the info displayed by the tooltip immediately.

The toggle should stay ON for some time after the mouse pointer leaves the element with the estimation, 
so the user has a chance to move the mouse over tooltip.
Toggle should not disappear if the user continues hovering over the tooltip.
This is needed so the user can use the toggle on the tooltip.

## Plugin scope

This Chrome plugin should work and be available only on http://www.gaiagps.com and https://www.gaiagps.com website.
It should be disabled and not have any popup on other websites.
It should not request any permissions to access pages on any other websites.