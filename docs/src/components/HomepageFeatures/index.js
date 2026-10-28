import { useState, useSyncExternalStore } from 'react';
import FeaturesBento from '@site/src/components/FeaturesBento';
import FeaturesHex from '@site/src/components/FeaturesHex';

const SECTION_ID = 'why-bestax';

/*
 * Which layout this visit gets, picked once per page load and kept for the
 * rest of the session's client-side navigation.
 *
 * The prerendered page always carries the bento, so the HTML has the full copy
 * whatever the reader's browser picks. A reader who lands with the section
 * already on screen (a reload partway down the page) keeps the bento rather
 * than watching it swap. `?features=bento` or `?features=hex` pins one, for
 * checking a layout without reloading until it comes up.
 */
let picked = null;

function pickLayout() {
  if (picked !== null) return picked;
  const pinned = new URLSearchParams(window.location.search).get('features');
  if (pinned === 'bento' || pinned === 'hex') {
    picked = pinned;
  } else {
    const section = document.getElementById(SECTION_ID);
    const onScreen =
      section !== null &&
      section.getBoundingClientRect().top < window.innerHeight;
    picked = onScreen || Math.random() < 0.5 ? 'bento' : 'hex';
  }
  return picked;
}

const noUpdates = () => () => {};
const prerendered = () => 'bento';

/**
 * The "Why bestax" section, in one of two layouts at random. Clicking a hex
 * badge in the hex layout swaps in the bento, whose cards show each feature
 * working.
 */
export default function HomepageFeatures() {
  const layout = useSyncExternalStore(noUpdates, pickLayout, prerendered);
  const [revealed, setRevealed] = useState(false);

  return (
    <div id={SECTION_ID}>
      {layout === 'hex' && !revealed ? (
        <FeaturesHex onPick={() => setRevealed(true)} />
      ) : (
        <FeaturesBento focusOnMount={revealed} />
      )}
    </div>
  );
}
