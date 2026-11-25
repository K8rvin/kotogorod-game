import { cats, chains } from "./data";
import type { ChainId } from "./core/state";

export function svgUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function cozy(tier: number): string {
  const shapes = [
    `<circle cx="62" cy="63" r="34" fill="url(#fur)"/><path d="M33 53q29-20 58 0M30 66q32-18 64 0M35 79q27-15 53 0M44 91q18-10 36 0" fill="none" stroke="#bd5961" stroke-width="5" stroke-linecap="round"/><path d="M87 85q28 4 20 23" fill="none" stroke="#f28a8c" stroke-width="6" stroke-linecap="round"/><circle cx="51" cy="47" r="9" fill="#ffb2aa" opacity=".65"/>`,
    `<path d="M28 83Q4 82 17 105" fill="none" stroke="#a7a9b7" stroke-width="7" stroke-linecap="round"/><ellipse cx="56" cy="72" rx="35" ry="26" fill="#a8adbc"/><circle cx="85" cy="54" r="22" fill="#b9beca"/><circle cx="72" cy="34" r="13" fill="#e5a5ac"/><circle cx="98" cy="35" r="13" fill="#e5a5ac"/><circle cx="81" cy="51" r="4" fill="#273145"/><circle cx="101" cy="61" r="5" fill="#e77f91"/><path d="M45 64q12-10 23 0M43 76q12-9 23 0" fill="none" stroke="#81889a" stroke-width="4"/><path d="M99 65l15 4M97 70l15 8" stroke="#d9dce4" stroke-width="2"/>`,
    `<path d="M22 57h88l-11 43q-34 17-66 0z" fill="#64a9c9"/><ellipse cx="66" cy="57" rx="44" ry="15" fill="#326d8d"/><ellipse cx="66" cy="55" rx="37" ry="10" fill="#fff2d5"/><path d="M37 77q29 13 58 0" fill="none" stroke="#3e84a5" stroke-width="5"/><path d="M54 29q-9-14 2-22M77 29q-8-13 3-22" fill="none" stroke="#fff6e3" stroke-width="4" opacity=".6" stroke-linecap="round"/><path d="M54 91q12 9 24 0" fill="none" stroke="#b9e0ec" stroke-width="3"/>`,
    `<ellipse cx="65" cy="83" rx="51" ry="29" fill="#b85f77"/><ellipse cx="65" cy="69" rx="51" ry="28" fill="#f09ca5"/><ellipse cx="65" cy="66" rx="37" ry="17" fill="#ffd49b"/><path d="M39 62q12-9 23 0M72 61q12-9 23 0" fill="none" stroke="#e0ad79" stroke-width="4"/><circle cx="65" cy="30" r="7" fill="#ffe8a9"/><path d="M65 36v12" stroke="#ffe8a9" stroke-width="3"/>`,
    `<path d="M20 61L65 20l46 41z" fill="#d97655"/><path d="M29 59h73v51H29z" fill="#f5ddae"/><path d="M55 110V76q11-16 22 0v34" fill="#7c513f"/><rect x="37" y="68" width="14" height="16" rx="4" fill="#ffd475"/><rect x="82" y="68" width="13" height="16" rx="4" fill="#ffd475"/><path d="M65 21V11" stroke="#e9b764" stroke-width="4"/><path d="M64 9q18-5 20 7q-16 7-20-7" fill="#8bc79b"/>`,
    `<path d="M25 107h82v8H25z" fill="#8b5f52"/><path d="M43 103V43h18v60M79 103V23h18v80" fill="#b77a5d"/><path d="M22 43h61v14H22zM58 20h56v14H58zM22 76h76v14H22z" fill="#e9b879"/><path d="M28 43q17-30 35 0M69 20q15-24 29 0" fill="#ed9ca5"/><circle cx="89" cy="66" r="13" fill="#f5d493"/><path d="M84 66q5-8 10 0q-5 10-10 0" fill="#d78571"/>`,
    `<path d="M12 61L41 31l29 30zM62 51l30-32 31 32z" fill="#d77659"/><path d="M19 60h54v53H19zM67 50h49v63H67z" fill="#f5dcae"/><path d="M40 113V82h18v31M81 113V77h19v36" fill="#815344"/><g fill="#ffd777"><rect x="26" y="68" width="11" height="14" rx="3"/><rect x="56" y="68" width="11" height="14" rx="3"/><rect x="73" y="58" width="11" height="14" rx="3"/><rect x="99" y="58" width="11" height="14" rx="3"/></g><path d="M12 116h107" stroke="#80b995" stroke-width="8" stroke-linecap="round"/><circle cx="112" cy="34" r="10" fill="#ffe6a0"/>`
  ];
  return shapes[tier - 1];
}

function food(tier: number): string {
  const shapes = [
    `<path d="M46 18h37v18l10 16v54q-27 16-56 0V52l9-16z" fill="#e6f0e9"/><path d="M45 18h39v16H45z" fill="#70a9c6"/><path d="M38 61h54v43q-27 15-54 0z" fill="#fff2d5"/><path d="M50 62q14 12 28 0" fill="none" stroke="#e8d8b8" stroke-width="4"/><path d="M57 74l4 7l8 1l-6 5l2 8l-8-4l-7 4l1-8l-6-5l8-1z" fill="#e6b968"/>`,
    `<path d="M22 69q34-44 77-8l23-19l-3 31l3 29l-24-17q-43 34-76-16z" fill="#71b7c9"/><circle cx="77" cy="59" r="5" fill="#22374b"/><path d="M36 65q14 10 29 0M51 51l13 23l-17 11" fill="none" stroke="#438b9f" stroke-width="4"/><path d="M28 68l-15-8" stroke="#9ed9df" stroke-width="5" stroke-linecap="round"/>`,
    `<path d="M21 91L40 35l69 10l-8 56z" fill="#f3c85e"/><path d="M40 35l33 31l36-21" fill="#ffe491"/><g fill="#d9a849"><circle cx="51" cy="67" r="7"/><circle cx="82" cy="83" r="6"/><circle cx="86" cy="51" r="5"/></g><path d="M23 93l79 9" stroke="#c38d41" stroke-width="5"/>`,
    `<path d="M28 50h76l10 52q-45 22-92 0z" fill="#b7674d"/><ellipse cx="66" cy="50" rx="38" ry="13" fill="#774334"/><ellipse cx="66" cy="49" rx="32" ry="9" fill="#c8d783"/><path d="M20 61q-19 4-7 23q8 8 15-2M111 61q19 4 7 23q-8 8-15-2" fill="none" stroke="#b7674d" stroke-width="7"/><path d="M50 29q-9-13 3-22M75 29q-9-13 3-22" fill="none" stroke="#f5ead2" stroke-width="4" opacity=".7" stroke-linecap="round"/><circle cx="53" cy="47" r="4" fill="#f3e6ad"/><circle cx="77" cy="52" r="4" fill="#e9a967"/>`,
    `<path d="M22 75h89l-8 29H31z" fill="#cc7b61"/><path d="M28 57h77l6 19H22z" fill="#fff0cf"/><path d="M36 40h61l8 18H28z" fill="#f3b2ad"/><path d="M44 28h45l8 13H36z" fill="#fff0cf"/><path d="M43 43q9 9 18 0q9 9 18 0q9 9 18 0" fill="none" stroke="#d8797f" stroke-width="5"/><path d="M66 27V12" stroke="#7ca787" stroke-width="4"/><path d="M66 14q-16-15-17 2q10 10 17-2M67 14q16-15 17 2q-10 10-17-2" fill="#e9897f"/>`,
    `<path d="M24 55h86l-8 57H32z" fill="#bf8550"/><path d="M35 56q2-46 31-43q29-2 32 43" fill="none" stroke="#dbac6f" stroke-width="9"/><path d="M28 67h78M27 81h77M46 55l-5 54M66 55v57M86 55l5 54" stroke="#e2b16d" stroke-width="4"/><path d="M34 51l18-23l12 25M62 52l18-29l20 29" fill="#f4e4bd"/><circle cx="52" cy="33" r="9" fill="#d87a72"/><path d="M82 29q15-12 19 1q-11 12-19-1" fill="#7fba88"/>`,
    `<path d="M13 82h107v15H13z" fill="#a56949"/><path d="M25 96v19M107 96v19" stroke="#784632" stroke-width="9"/><ellipse cx="66" cy="75" rx="54" ry="16" fill="#f3d9a4"/><path d="M29 72q7-28 29-10q9-41 31-9q23-9 23 20" fill="#fff0d0"/><circle cx="43" cy="60" r="12" fill="#d78270"/><path d="M65 59q12-26 25 0" fill="#7bb684"/><ellipse cx="88" cy="69" rx="16" ry="8" fill="#6fa8bf"/><path d="M35 86h64" stroke="#d4ae78" stroke-width="4"/>`
  ];
  return shapes[tier - 1];
}

function garden(tier: number): string {
  const shapes = [
    `<ellipse cx="64" cy="68" rx="23" ry="32" fill="#a87952" transform="rotate(28 64 68)"/><path d="M52 50q19 12 24 36" fill="none" stroke="#d2a36d" stroke-width="4"/><path d="M70 38q2-19 22-20q-1 18-22 20" fill="#82b982"/><path d="M36 105q29-16 57 0" fill="#654e3c"/>`,
    `<path d="M63 107V52" stroke="#6da56d" stroke-width="7" stroke-linecap="round"/><path d="M62 70Q24 72 29 38q35-3 33 32M65 55q5-36 40-31q0 34-40 31" fill="#80c48a"/><path d="M35 108h60l-8 10H43z" fill="#a9714e"/><path d="M34 106q30-15 61 0" fill="#6b503d"/>`,
    `<path d="M65 108V57" stroke="#6ca66d" stroke-width="6"/><path d="M64 85Q38 64 30 88q20 15 34-3M66 78q25-19 33 5q-18 15-33-5" fill="#7cbd82"/><g fill="#f0a3b4"><ellipse cx="65" cy="30" rx="13" ry="24"/><ellipse cx="65" cy="30" rx="13" ry="24" transform="rotate(60 65 49)"/><ellipse cx="65" cy="30" rx="13" ry="24" transform="rotate(120 65 49)"/><ellipse cx="65" cy="30" rx="13" ry="24" transform="rotate(180 65 49)"/><ellipse cx="65" cy="30" rx="13" ry="24" transform="rotate(240 65 49)"/><ellipse cx="65" cy="30" rx="13" ry="24" transform="rotate(300 65 49)"/></g><circle cx="65" cy="49" r="14" fill="#f6d371"/>`,
    `<path d="M66 108V65" stroke="#698b5b" stroke-width="7"/><g fill="#76b67b"><circle cx="42" cy="65" r="27"/><circle cx="73" cy="47" r="33"/><circle cx="94" cy="73" r="25"/><circle cx="54" cy="88" r="28"/></g><g fill="#f2c5d2"><circle cx="42" cy="54" r="6"/><circle cx="71" cy="35" r="7"/><circle cx="93" cy="63" r="6"/><circle cx="59" cy="78" r="6"/><circle cx="83" cy="79" r="5"/></g><path d="M28 110h78" stroke="#9c6e4d" stroke-width="9" stroke-linecap="round"/>`,
    `<path d="M58 110l7-61h10l6 61" fill="#916645"/><path d="M67 70L43 45M73 65l22-28" stroke="#916645" stroke-width="8"/><g fill="#83b979"><circle cx="41" cy="42" r="29"/><circle cx="69" cy="28" r="34"/><circle cx="99" cy="45" r="29"/><circle cx="72" cy="60" r="29"/></g><g fill="#e79075"><circle cx="43" cy="39" r="7"/><circle cx="78" cy="24" r="7"/><circle cx="94" cy="51" r="7"/><circle cx="59" cy="61" r="7"/></g><path d="M29 113q39-16 79 0" fill="#6b9b68"/>`,
    `<path d="M20 106V66q44-36 88 0v40" fill="none" stroke="#b98a60" stroke-width="10"/><path d="M20 69q44-39 88 0" fill="none" stroke="#78aa72" stroke-width="15"/><path d="M31 106V75M98 106V75M42 107h47" stroke="#d8b27e" stroke-width="7"/><g fill="#f0bdc9"><circle cx="29" cy="56" r="7"/><circle cx="51" cy="41" r="7"/><circle cx="78" cy="41" r="7"/><circle cx="101" cy="58" r="7"/></g><path d="M40 87q25-17 50 0" fill="none" stroke="#7fac76" stroke-width="8"/>`,
    `<path d="M16 102V53l49-35l49 35v49" fill="#dbe4c6"/><path d="M16 53l49-35l49 35" fill="none" stroke="#7ba184" stroke-width="7"/><path d="M65 19v83M16 53h98M39 36v66M91 36v66" stroke="#8cae97" stroke-width="4"/><path d="M55 102V76q10-15 20 0v26" fill="#a97a55"/><g fill="#e9a7b8"><circle cx="30" cy="63" r="8"/><circle cx="90" cy="62" r="8"/><circle cx="45" cy="52" r="6"/></g><path d="M7 106h116" stroke="#6e9d69" stroke-width="10" stroke-linecap="round"/>`
  ];
  return shapes[tier - 1];
}

function craft(tier: number): string {
  const shapes = [
    `<path d="M57 17h17l3 12l11 5l11-5l12 13l-8 11l2 12l11 8l-5 17l-14 1l-8 10l-1 14H59l-5-13l-11-5l-12 5L19 86l8-12l-2-12l-12-8l6-17l14-1l8-10z" fill="#82a9bb"/><circle cx="65" cy="66" r="27" fill="#446c82"/><circle cx="65" cy="66" r="13" fill="#d7bc7f"/><path d="M43 43l44 44M87 43L43 87" stroke="#a9c7d0" stroke-width="4"/>`,
    `<path d="M43 28h45l9 19v57H33V47z" fill="#e2a85f"/><path d="M43 28V16h45v12M35 47h60M35 93h60" stroke="#5c6671" stroke-width="7"/><rect x="43" y="51" width="44" height="36" rx="9" fill="#ffe4a0"/><path d="M52 82q14-35 26 0" fill="#fff4c2"/><path d="M43 16q22-19 44 0" fill="none" stroke="#5c6671" stroke-width="6"/>`,
    `<path d="M14 59q12-43 51-41q40-2 53 41q-16-9-28 3q-12-11-25 0q-13-12-25 0q-12-12-26-3z" fill="#798fc2"/><path d="M65 19v68q0 20 19 14q9-4 4-15" fill="none" stroke="#d7b67c" stroke-width="6" stroke-linecap="round"/><path d="M65 20L39 58M65 20l28 38" stroke="#aab9da" stroke-width="3"/>`,
    `<path d="M26 41h64v62H26z" fill="#7d9fa6"/><path d="M90 56h18v47H26" fill="#adc1bd"/><path d="M39 40V24h39v16M44 24V13h28v11" fill="none" stroke="#b7c9c2" stroke-width="7"/><circle cx="65" cy="66" r="18" fill="#e0bb76"/><circle cx="65" cy="66" r="8" fill="#596c74"/><path d="M37 95h58M92 39h12v22" stroke="#e3c385" stroke-width="5"/>`,
    `<path d="M36 19h57l12 91H24z" fill="#9d704f"/><circle cx="65" cy="53" r="26" fill="#f4dfac"/><circle cx="65" cy="53" r="21" fill="#fff0cd"/><path d="M65 53V36M65 53l13 9" stroke="#51493f" stroke-width="4" stroke-linecap="round"/><circle cx="65" cy="90" r="12" fill="#e4b862"/><path d="M65 70v10" stroke="#e4b862" stroke-width="5"/><path d="M35 20l30-13l29 13" fill="#c28c5e"/>`,
    `<circle cx="64" cy="43" r="28" fill="#9eb9bd"/><path d="M43 28L35 9l22 12M84 27l9-19l-22 12" fill="#9eb9bd"/><circle cx="54" cy="42" r="4" fill="#2d414d"/><circle cx="75" cy="42" r="4" fill="#2d414d"/><path d="M59 54q6 5 12 0" fill="none" stroke="#4e6870" stroke-width="3"/><path d="M38 68h53l13 43H25z" fill="#6f969f"/><circle cx="64" cy="86" r="12" fill="#edc575"/><path d="M30 74L9 91M96 74l21 17" stroke="#9eb9bd" stroke-width="9" stroke-linecap="round"/><path d="M43 110v9M84 110v9" stroke="#526f79" stroke-width="9"/>`,
    `<path d="M15 57L64 18l50 39z" fill="#638c9f"/><path d="M24 57h81v57H24z" fill="#d9bd87"/><path d="M43 113V78h43v35" fill="#776050"/><circle cx="43" cy="51" r="13" fill="#f2cf7b"/><circle cx="87" cy="51" r="13" fill="#f2cf7b"/><path d="M43 51h44M43 51l-8 43M87 51l8 43" stroke="#759ba4" stroke-width="4"/><path d="M7 116h115" stroke="#587c6c" stroke-width="8" stroke-linecap="round"/><path d="M105 34V12h12v32" fill="#9d7055"/>`
  ];
  return shapes[tier - 1];
}

function music(tier: number): string {
  const shapes = [
    `<path d="M60 24v61q-13-9-28 0q-19 15-5 27q17 12 34-4q7-8 6-21V43q22 2 31 17q4-28-38-36z" fill="#bd91e8"/><path d="M61 43q17 2 26 12" fill="none" stroke="#e1c4f5" stroke-width="4"/>`,
    `<path d="M43 28q22-20 43 0l10 55H32z" fill="#e5bc67"/><ellipse cx="64" cy="84" rx="33" ry="13" fill="#f4d98e"/><path d="M64 88v16" stroke="#9a6c3d" stroke-width="6"/><circle cx="64" cy="107" r="8" fill="#c48748"/><path d="M48 27V15h32v12" fill="none" stroke="#9a6c3d" stroke-width="6"/><path d="M47 48q17 9 34 0" fill="none" stroke="#fff0b4" stroke-width="4"/>`,
    `<path d="M66 42q-18-20-29 1q-8 15 5 27q-25 19-3 35q20 14 28-7q10 21 29 7q22-17-3-35q13-12 5-27q-11-21-32-1z" fill="#b86e51"/><path d="M65 43v56M56 43l19 56M73 43L54 99" stroke="#f2d5a2" stroke-width="2"/><path d="M64 28v22M55 26h20" stroke="#734735" stroke-width="6"/><path d="M21 99L108 20" stroke="#d9bc8b" stroke-width="4"/><path d="M25 94L104 24" stroke="#f2e4c8" stroke-width="2"/>`,
    `<ellipse cx="64" cy="46" rx="42" ry="19" fill="#e9d8b1"/><path d="M22 46l8 53q34 21 68 0l8-53q-41 22-84 0z" fill="#b86c66"/><ellipse cx="64" cy="45" rx="36" ry="14" fill="#f4e5c4"/><path d="M33 63l62 30M95 63l-62 30" stroke="#e7b98a" stroke-width="5"/><path d="M32 24l23 20M96 24L73 44" stroke="#b89364" stroke-width="6" stroke-linecap="round"/><circle cx="30" cy="22" r="7" fill="#e2c392"/><circle cx="98" cy="22" r="7" fill="#e2c392"/>`,
    `<path d="M18 34h92v75H18z" fill="#5d4b64"/><path d="M18 34l15-17h92l-15 17" fill="#7e6882"/><path d="M25 60h78v35H25z" fill="#f0e6d1"/><g fill="#4b4152"><path d="M35 60h8v23h-8zM52 60h8v23h-8zM76 60h8v23h-8zM91 60h8v23h-8z"/></g><path d="M25 95h78M29 109v10M100 109v10" stroke="#403746" stroke-width="6"/><circle cx="87" cy="41" r="7" fill="#e6bc70"/>`,
    `<path d="M30 70h42v42H30z" fill="#9b6e53"/><circle cx="51" cy="91" r="16" fill="#4d4951"/><circle cx="51" cy="91" r="5" fill="#d9ad68"/><path d="M66 77l23-20" stroke="#d9ad68" stroke-width="6"/><path d="M83 58V40" stroke="#d9ad68" stroke-width="5"/><path d="M84 43Q41 39 43 9q43-4 69 15q9 9-2 17q-11 8-26 2z" fill="#e1b66f"/><path d="M51 14q28 0 48 15" fill="none" stroke="#f5d99a" stroke-width="4"/>`,
    `<path d="M13 61L63 19l52 42z" fill="#896da0"/><path d="M22 60h84v54H22z" fill="#d8b891"/><path d="M29 106V72h16v34M82 106V72h16v34" fill="#72546b"/><path d="M52 114V76h24v38" fill="#584355"/><path d="M32 39h63" stroke="#efc97c" stroke-width="6"/><path d="M43 26q20-22 40 0" fill="none" stroke="#efc97c" stroke-width="5"/><path d="M51 51v15M76 51v15" stroke="#f4dc9e" stroke-width="5"/><circle cx="51" cy="48" r="7" fill="#bd91e8"/><circle cx="76" cy="48" r="7" fill="#bd91e8"/>`
  ];
  return shapes[tier - 1];
}

function stars(tier: number): string {
  const shapes = [
    `<path d="M44 25h41v18l10 16v49q-30 16-61 0V59l10-16z" fill="#739ebd" opacity=".85"/><path d="M43 24h43v15H43z" fill="#b5a6d2"/><path d="M40 68h50v37q-25 13-50 0z" fill="#729bdc" opacity=".6"/><g fill="#fff0ae"><path d="M51 69l3 7l7 1l-6 5l2 7l-7-4l-6 4l1-7l-5-5l7-1z"/><path d="M74 87l2 5l5 1l-4 3l1 5l-5-3l-4 3l1-5l-4-3l5-1z"/><circle cx="74" cy="62" r="4"/></g>`,
    `<circle cx="65" cy="65" r="31" fill="#ffe9a1" opacity=".22"/><path d="M45 51q20-24 40 0l-5 37q-15 24-30 0z" fill="#e8d477"/><ellipse cx="65" cy="88" rx="17" ry="8" fill="#9d8753"/><path d="M54 43L42 24M76 43l12-19" stroke="#9b9163" stroke-width="4"/><path d="M47 55L19 41q-4 29 29 34M83 55l28-14q4 29-29 34" fill="#b9d7c4" opacity=".75"/><circle cx="65" cy="62" r="10" fill="#fff5b9"/>`,
    `<path d="M21 29q43-13 45 8q5-21 45-8v72q-37-11-45 7q-9-18-45-7z" fill="#738ab8"/><path d="M28 34q28-7 34 5v59q-9-10-34-5M103 34q-28-7-34 5v59q9-10 34-5" fill="#f0e3c1"/><path d="M66 38v60" stroke="#c6b28e" stroke-width="3"/><g fill="#8b78a8"><path d="M44 49l3 6l6 1l-5 4l2 6l-7-3l-5 3l1-6l-5-4l6-1z"/><path d="M82 67l3 6l6 1l-5 4l2 6l-7-3l-5 3l1-6l-5-4l6-1z"/></g>`,
    `<path d="M28 99L80 31l17 14l-52 68z" fill="#759fc0"/><path d="M76 34l12-16l24 20l-15 15z" fill="#b4cbd8"/><path d="M26 94l-8 19h17" fill="none" stroke="#a8885c" stroke-width="7"/><path d="M49 75L27 112M49 75l36 37M49 75l5 40" stroke="#a8885c" stroke-width="7" stroke-linecap="round"/><circle cx="94" cy="31" r="7" fill="#d8ecf1"/><path d="M19 28l3 7l7 1l-6 5l2 7l-7-4l-6 4l1-7l-5-5l7-1z" fill="#f5dc8e"/>`,
    `<path d="M64 14l31 36l-11 53l-22 16l-27-13l-12-53z" fill="#8eacd9"/><path d="M64 14v105l22-16l9-53z" fill="#b6d7ed"/><path d="M23 53l41 18l31-21M35 103l29-32l20 32" fill="none" stroke="#e1f2f4" stroke-width="3" opacity=".7"/><circle cx="65" cy="66" r="42" fill="none" stroke="#b9a9e0" stroke-width="3" opacity=".5"/><path d="M64 44l6 14l14 2l-11 10l3 15l-13-7l-13 7l3-15l-11-10l14-2z" fill="#fff2b6"/>`,
    `<circle cx="65" cy="65" r="14" fill="#f3cf75"/><ellipse cx="65" cy="65" rx="52" ry="24" fill="none" stroke="#9fa7cb" stroke-width="4" transform="rotate(-25 65 65)"/><ellipse cx="65" cy="65" rx="48" ry="32" fill="none" stroke="#8ba9c3" stroke-width="3" transform="rotate(45 65 65)"/><circle cx="25" cy="86" r="9" fill="#d79485"/><circle cx="100" cy="38" r="11" fill="#8cb6d2"/><circle cx="91" cy="101" r="7" fill="#b5a0d4"/><path d="M65 12v20M65 99v18M7 65h18M105 65h18" stroke="#d8bc7a" stroke-width="4"/>`,
    `<path d="M44 111V45h42v66" fill="#7386ae"/><path d="M35 45h60L82 23H48z" fill="#b0bad2"/><path d="M50 24L65 6l16 18" fill="#e2ca81"/><circle cx="65" cy="54" r="24" fill="#fff0ae"/><circle cx="65" cy="54" r="39" fill="none" stroke="#d4c18b" stroke-width="4" opacity=".65"/><path d="M65 38l5 11l12 1l-9 8l3 12l-11-6l-11 6l3-12l-9-8l12-1z" fill="#fff8d7"/><path d="M31 112h68l11 9H20z" fill="#556785"/><path d="M65 12V1" stroke="#f5dc92" stroke-width="3"/>`
  ];
  return shapes[tier - 1];
}

const painters: Record<ChainId, (tier: number) => string> = { cozy, food, garden, craft, music, stars };

export function itemSvg(chain: ChainId, tier: number): string {
  const color = chains[chain].color;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 132 132"><defs><linearGradient id="fur" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffada1"/><stop offset="1" stop-color="${color}"/></linearGradient></defs><ellipse cx="66" cy="116" rx="39" ry="7" fill="#111a2a" opacity=".18"/>${painters[chain](Math.max(1, Math.min(7, tier)))}</svg>`;
}

export function itemUri(chain: ChainId, tier: number): string {
  return svgUri(itemSvg(chain, tier));
}

export function catSvg(catId: string): string {
  const cat = cats.find((entry) => entry.id === catId) ?? cats[0];
  const fur = cat.color;
  const accent = cat.accent;
  let accessory = "";
  switch (cat.accessory) {
    case "vest": accessory = `<path d="M55 157l20 22l-10 40H43V166zM145 157l-20 22l10 40h22V166z" fill="${accent}"/><path d="M68 175h64" stroke="#e8d6ac" stroke-width="4"/><circle cx="100" cy="190" r="4" fill="#fff1b5"/>`; break;
    case "scarf": accessory = `<path d="M52 148q48 22 96 0l-3 25q-45 19-90 0z" fill="${accent}"/><path d="M127 166l20 55l-22-5l-14-48z" fill="${accent}"/><path d="M133 182l11-3M137 197l10-3" stroke="#f5c2a0" stroke-width="3"/>`; break;
    case "chef": accessory = `<path d="M59 49q-20-30 8-37q12-25 33-7q23-19 35 6q28 6 8 37z" fill="#fff1db"/><path d="M58 42h85v20H58z" fill="#f5e3cf"/><path d="M54 158q46 18 92 0l-8 26q-38 15-76 0z" fill="${accent}"/>`; break;
    case "captain": accessory = `<path d="M51 53q6-42 49-41q43-1 51 41z" fill="#edf0e7"/><path d="M45 52h110v15H45z" fill="${accent}"/><path d="M85 25h31v18H85z" fill="#e7b966"/><path d="M99 26v14M92 33h15" stroke="#54758f" stroke-width="3"/>`; break;
    case "flower": case "leaf": accessory = `<path d="M133 56q24-23 32-2q-11 19-32 2" fill="${accent}"/><g fill="#f2b6c5"><circle cx="142" cy="44" r="10"/><circle cx="153" cy="52" r="10"/><circle cx="134" cy="55" r="10"/></g><circle cx="143" cy="52" r="7" fill="#f1d078"/>`; break;
    case "beret": accessory = `<path d="M51 53q10-48 62-42q39 2 43 37q-53-11-105 5z" fill="${accent}"/><path d="M105 14q-2-15 7-13" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>`; break;
    case "goggles": accessory = `<path d="M47 62h106" stroke="#695343" stroke-width="10"/><circle cx="74" cy="64" r="23" fill="#a9d5dc" fill-opacity=".55" stroke="${accent}" stroke-width="7"/><circle cx="128" cy="64" r="23" fill="#a9d5dc" fill-opacity=".55" stroke="${accent}" stroke-width="7"/><path d="M97 61h8" stroke="${accent}" stroke-width="7"/>`; break;
    case "glasses": accessory = `<circle cx="73" cy="90" r="24" fill="none" stroke="${accent}" stroke-width="5"/><circle cx="130" cy="90" r="24" fill="none" stroke="${accent}" stroke-width="5"/><path d="M97 88h10M47 84l-17-5M155 84l16-5" stroke="${accent}" stroke-width="5"/>`; break;
    case "bow": accessory = `<path d="M99 163q-43-29-44 8q9 28 44 4q35 24 44-4q-1-37-44-8z" fill="${accent}"/><circle cx="99" cy="169" r="12" fill="#f1c486"/>`; break;
    case "conductor": case "cap": accessory = `<path d="M50 54q10-41 51-40q41-1 50 40z" fill="${accent}"/><path d="M43 52q58-12 115 0l-8 17H50z" fill="#4a5365"/><circle cx="101" cy="32" r="9" fill="#edc571"/>`; break;
    case "star": accessory = `<path d="M139 30l6 13l14 2l-10 10l2 14l-13-7l-12 7l3-14l-11-10l14-2z" fill="${accent}"/><path d="M57 155q43 17 86 0" fill="none" stroke="${accent}" stroke-width="12"/>`; break;
    case "headphones": accessory = `<path d="M47 91q-8-71 54-71q62 0 54 71" fill="none" stroke="${accent}" stroke-width="12"/><rect x="35" y="78" width="25" height="50" rx="12" fill="${accent}"/><rect x="143" y="78" width="25" height="50" rx="12" fill="${accent}"/>`; break;
  }
  const stripe = ["bars", "motya", "gear", "caramel"].includes(cat.id) ? `<path d="M83 48l8 19M100 43v23M117 48l-8 19" stroke="#8c654f" stroke-width="6" stroke-linecap="round" opacity=".65"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="230" viewBox="0 0 200 230"><defs><linearGradient id="catfur" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${fur}"/><stop offset="1" stop-color="${fur}" stop-opacity=".78"/></linearGradient></defs><ellipse cx="101" cy="216" rx="64" ry="10" fill="#101725" opacity=".2"/><path d="M137 175q62-7 38-64q-7-13-20-2q20 31-1 41q-11 5-23 1" fill="none" stroke="${fur}" stroke-width="22" stroke-linecap="round"/><ellipse cx="100" cy="174" rx="58" ry="51" fill="url(#catfur)"/><path d="M49 74L39 17l46 30M151 74l10-57l-46 30" fill="${fur}"/><path d="M51 53L47 31l22 20M149 53l4-22l-22 20" fill="#e7a7a2" opacity=".7"/><ellipse cx="100" cy="91" rx="62" ry="57" fill="url(#catfur)"/>${stripe}<ellipse cx="72" cy="88" rx="8" ry="11" fill="#263141"/><ellipse cx="129" cy="88" rx="8" ry="11" fill="#263141"/><circle cx="75" cy="84" r="3" fill="#fff"/><circle cx="132" cy="84" r="3" fill="#fff"/><path d="M93 106q7-7 14 0q-7 11-14 0" fill="#c77e7e"/><path d="M100 113q-2 14-16 8M100 113q2 14 16 8" fill="none" stroke="#5f4a48" stroke-width="3" stroke-linecap="round"/><path d="M60 106l-33-5M61 114l-34 5M140 106l33-5M139 114l34 5" stroke="#f1e1ce" stroke-width="3" stroke-linecap="round" opacity=".8"/><ellipse cx="70" cy="207" rx="25" ry="13" fill="${fur}"/><ellipse cx="132" cy="207" rx="25" ry="13" fill="${fur}"/>${accessory}</svg>`;
}

export function catUri(catId: string): string {
  return svgUri(catSvg(catId));
}
