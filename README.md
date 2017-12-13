# Fit To Width
Fits text on most web pages to the width of your phone.

For Firefox Desktop, install from AMO:
https://addons.mozilla.org/en-US/firefox/addon/fit-text-to-width/

For Firefox Mobile, install from AMO:
https://addons.mozilla.org/en-US/android/addon/fit-text-to-width/

## Mechanism
This add-on is quite simple in implementation - it finds a bunch of
elements which it considers to be 'too big', then sets a width (via
css `max-width`) on them. The main problem then is just finding which
elements to process - we want to shrink most elements with heaps of
text in them, but if we accidently shrink an element whose width is
essential to the page layout, we'll break the layout.


## Algorithm
The algorithm to pick which elements to shrink is quite simple -
 - Shrink all elements which themselves have a width, but none of their children have a width.
 - In addition to this, shrink any elements that contain long text nodes.

This is a pretty basic algorithm but it seems to do the job well. Suggestions
for improvements are welcome, with the restriction that I want to be able
to decide if an element should be processed or not in a single pass (i.e.
without traipsing up and down the dom at a bunch of its children / ancestors).

