## Calculation

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

The outputs are: Naismith's estimate, correction %, corrected estimate.

## UI description

First, UI should have the two numerical inputs.

Categorical inputs should be implemented as adjacent buttons for an easy selection, one button for each value.
These buttons should be sorted by the correction value, from the lowest to the highest.
Categorical inputs should be displayed below the numerical inputs.

Under the inputs, 
UI should display the final calculated time in hours and minutes, rounded to the nearest minute.
It should also display the base Naismith's estimate and the final correction %.
Calculated values should be updated automatically and displayed when a user changes any of the inputs.

Default prepopulated value for:
- distance: 5 miles, 
- vertical gain: 1000 feet.

## LLM Output
hiking-time-calculator.html.
Math javascript code that implements the calculations should be 
in a separate file named hiking-time-calculator.js. UI JS code should be in the main html
hiking-time-calculator.html