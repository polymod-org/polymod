/* app statuses:
~ discord
- revolt
- element
X whatsapp
X guilded

- = yes, works
~ = somewhat works (doesn't error, just not working as intended)
X = broken
*/

/*
disclaimer even though mit license says essentially same:
if you ask for help / support with this (not working, how to use, anything), expect none
*/

(() => {
  const settingsInject = () => {
  if (document.querySelector('.polyglot-settings-element')) return; // already injected
  
  
  // stage 1 - grab
  const getItemsContainer = (x) => {
    if (x.children.length < 5) return getItemsContainer(x.children[0]);
    return x;
  };
  
  const findTextWithinParent = (el, text, depth = 5) => {
    if (depth <= 0) return false;
    if (!el.textContent.toLowerCase().includes(text)) return findTextWithinParent(el.parentElement, text, depth - 1);
  
    return true;
  };
  
  /* sidebar = getItemsContainer([...document.querySelectorAll('*')].filter((x) => {
    const rect = x.getBoundingClientRect();
  
    return rect.width > window.innerWidth * 0.15 && // Width >20% of window
      rect.width < window.innerWidth * 0.5 && // Width <50% of window
      rect.x === 0 && rect.y === 0; // At far left (x = 0)
  }).pop()); */

  /* const getUniqueChildrenClasses = (container) => {
    const mapped = [...container.children].slice(0, 5).reduce((acc, x) => acc.concat(...x.classList), []);
    const unique = [...new Set(mapped)];

    return unique;
  }; */

  const getUniqueChildrenProps = (container) => {
    const mapped = [...container.children].slice(0, 5).map((x) => x.tagName + x.className);
    const unique = [...new Set(mapped)];

    return unique;
  };
  
  let sidebar, content;
  const grab = () => {
    sidebar = [...document.querySelectorAll('* > * > * > *')].filter((x) => {
      const rect = x.getBoundingClientRect();
      // const parentRect = x.parentElement.getBoundingClientRect();
      const uniqueChildrenCount = getUniqueChildrenProps(x).length;

      return rect.width > window.innerWidth * 0.1 && // Width >10% of window
        rect.width < window.innerWidth * 0.4 && // Width <50% of window
        x.children.length > 5 && // Has >5 children
        uniqueChildrenCount < 5 && // Has <5 unique children props
        findTextWithinParent(x, 'settings'); // "Settings" in within some text within last 5 parents
    }).pop();

    sidebar.style.background = 'red';

  
    const getContentFromChild = (el) => {
      if (el.parentElement.children.length === 2) {
        const target = el.parentElement.children[1];
        const rect = target.getBoundingClientRect();

        if (rect.width > window.innerWidth * 0.5) {
          const findContainer = (x) => {
            if (x.children.length > 5) return x;
            return [...x.children].map(findContainer).find((x) => x);
          };

          console.log('target', target);

          const wanted = findContainer(target);

          console.log('wanted', wanted);

          const parentChildren = wanted.parentElement.children;
          if (parentChildren.length === 2 && (parentChildren[0].children.length === 0 || parentChildren[0].children[0].children.length === 0)) return wanted.parentElement;

          return wanted;
        }
      }

      if (!el.parentElement) return false;
      return getContentFromChild(el.parentElement);


      /* return el && ([...el.querySelectorAll('*')].find((x) =>
        x.getBoundingClientRect().width > window.innerWidth * 0.5 && // Width >50% of window
        matchesItemTitle(x.children[0])
      ) || getContentFromChild(el.parentElement)); */
    };
  
    content = getContentFromChild(sidebar);
  };
  
  grab();

  content.style.background = 'blue';
  
  const sidebarItemClasses = {
    selected: [...sidebar.children].find((x) => x.textContent.trim().toLowerCase() === content.children[0].textContent.trim().toLowerCase()).className,
    unselected: [...sidebar.children].slice(1).find((x) => x.textContent.trim().toLowerCase() !== content.children[0].textContent.trim().toLowerCase()).className
  };
  
  /* const sidebar = grabGenericImportantEl(0.1, 0.5, 5, 5, 'settings');
  const content = grabGenericImportantEl(0.5, 0.9, 4, 8, 'settings'); */
  
  console.log(sidebar, content);
  
  if (!sidebar || !content) return;
  
  // sideb.style.background = 'red';
  
  // stage 2 - replicate
  
  const isDivider = (el) => el.computedStyleMap().get('height').value === 1 || // is 1px high
    el.computedStyleMap().get('border-top-width').value === 1; // has 1px high top border
  
  const matchesClass = (el, className) => el && (el.className === className || matchesClass(el.children[0], className));
  
  const findTextNodeWithin = (el) => {
    if (el.nodeType === 3) return el;
  
    return [...el.childNodes].map((x) => findTextNodeWithin(x)).find((x) => x && x.textContent !== ' ');
  };
  
  const insertAfter = (newEl, base) => base.parentElement.insertBefore(newEl, base.parentElement.children[[...base.parentElement.children].indexOf(base) + 1]); // Node.insertBefore but after (sorry)
  
  let appendPoint;
  
  let sidebarIsItemsOnly = [...sidebar.children].slice(1).filter((x) => x.className !== sidebar.children[2].className).length === 0;
  let sidebarHasDividers = [...sidebar.children].find((x) => isDivider(x)) !== undefined;
  
  const addThing = (el) => {
    // if (!appendPoint) appendPoint = sidebarHasDividers ? [...sidebar.children].filter((x) => isDivider(x)).pop() : [...sidebar.children].pop();
    if (!appendPoint) appendPoint = [...sidebar.children].pop();
  
    el.classList.add('polyglot-settings-element');
  
    insertAfter(el, appendPoint);
  
    appendPoint = el;
  };
  
  const addHeader = (text) => {
    // so the main concept here is that for chat apps the first item in the sidebar is a header... so just do that instead of computing
    let el = sidebar.children[0].cloneNode(true);
  
    if (sidebarIsItemsOnly) {
      // el = [...document.querySelectorAll('*')].find((x) => x.textContent === 'Settings').cloneNode(true); // modal / layer title
      // el = [...document.querySelectorAll('*')].filter((x) => x.className.includes('title')).pop().cloneNode(true); // modal / layer title
      el = [...sidebar.parentElement.parentElement.querySelectorAll('*')].find((x) => x.computedStyleMap().get('font-size').value > 18).cloneNode(true);
      if (!el) return;
  
      setTimeout(() => { // timeout as computed things only work after appeneded / in DOM tree
        el.style.flexGrow = '0';
        el.style.padding = el.getBoundingClientRect().x === 0 ? '16px' : '';
        el.style.marginTop = el.computedStyleMap().get('margin-top')?.value > 10 ? '' : '30px';
      }, 10);
    }
  
    const textNode = findTextNodeWithin(el);
    textNode.textContent = text;
  
    addThing(el);
  };
  
  let hasAddedMaskIconStyle = false;
  
  const addItem = (text) => {
    const el = sidebar.children[2].cloneNode(true);
  
    const textNode = findTextNodeWithin(el);
    textNode.textContent = text;
  
    // icon - revolt, whatsapp
    const svgIcon = el.querySelector('svg');
    if (svgIcon) {
      svgIcon.style.transform = 'rotate(180deg)';
      svgIcon.setAttribute('viewBox', `0 0 14000 14000`);
      svgIcon.querySelector('path').setAttribute('d', `M10775 12614 c-335 -49 -501 -122 -674 -297 l-74 -75 -48 -189 c-106 -418 -175 -879 -221 -1483 -17 -226 -17 -1073 0 -1295 39 -511 105 -884 204 -1160 41 -115 43 -124 42 -230 -2 -124 -26 -222 -89 -360 -36 -79 -131 -231 -160 -255 -12 -10 -33 -8 -118 13 -101 26 -481 84 -712 109 -88 9 -312 13 -830 13 -772 0 -828 -3 -1030 -56 -62 -15 -192 -43 -291 -60 -98 -17 -213 -42 -254 -54 -158 -48 -330 -109 -451 -160 -70 -30 -193 -77 -275 -105 -82 -29 -228 -83 -324 -122 -96 -39 -231 -92 -300 -118 -69 -26 -181 -77 -249 -114 -67 -36 -133 -66 -147 -66 -14 0 -55 -18 -91 -40 -37 -22 -71 -40 -76 -40 -13 0 -278 -100 -322 -123 -22 -11 -62 -34 -90 -52 -27 -18 -78 -44 -112 -58 -59 -24 -144 -82 -226 -154 -24 -22 -47 -33 -67 -33 -46 0 -434 -154 -705 -280 -49 -23 -121 -53 -159 -66 -38 -13 -80 -31 -92 -39 -13 -8 -30 -15 -38 -15 -9 0 -71 -26 -138 -59 -144 -69 -249 -111 -276 -111 -11 0 -30 -8 -43 -18 -13 -10 -49 -33 -79 -51 -30 -18 -82 -59 -116 -91 -52 -50 -68 -59 -110 -65 -54 -8 -105 -34 -174 -89 -25 -20 -49 -36 -55 -36 -5 0 -27 -5 -47 -10 -30 -9 -43 -21 -69 -68 -18 -31 -58 -82 -89 -112 -30 -30 -59 -68 -65 -84 -8 -25 -23 -35 -95 -63 -190 -73 -334 -155 -674 -382 -21 -14 -53 -26 -71 -27 -23 0 -49 -15 -94 -52 -113 -94 -397 -251 -483 -267 -21 -4 -38 -12 -38 -19 0 -6 9 -38 20 -71 19 -56 19 -60 3 -69 -36 -19 -103 -94 -103 -114 0 -33 37 -52 105 -52 81 0 452 59 549 87 12 3 16 1 12 -6 -4 -6 -15 -11 -25 -11 -10 0 -24 -7 -31 -15 -7 -8 -45 -33 -86 -55 -51 -29 -99 -68 -162 -133 -196 -201 -282 -329 -261 -384 l8 -22 68 19 c37 11 88 25 113 31 25 6 57 17 72 25 88 47 509 179 685 214 59 12 131 33 160 46 53 25 217 68 301 79 26 4 90 15 143 26 52 10 221 35 375 55 301 39 457 42 506 10 13 -8 52 -20 88 -26 36 -6 76 -16 88 -21 13 -5 90 -20 172 -33 129 -21 200 -42 546 -157 220 -73 424 -140 454 -150 198 -63 791 -211 915 -229 39 -5 138 -24 220 -41 83 -17 175 -35 205 -39 30 -4 91 -17 135 -28 172 -44 558 -87 756 -83 l136 2 9 -43 c4 -24 8 -209 8 -413 1 -289 4 -379 15 -410 20 -57 8 -294 -23 -463 -41 -220 -70 -305 -136 -397 -73 -101 -90 -135 -90 -180 0 -45 31 -65 144 -95 152 -39 159 -43 305 -185 330 -321 425 -375 631 -362 96 6 207 42 246 78 17 16 27 20 32 12 11 -17 101 -83 128 -93 13 -5 70 -16 125 -25 213 -32 519 -130 633 -204 146 -94 353 -143 456 -108 25 9 45 28 72 69 48 72 76 92 179 124 124 38 138 44 159 72 26 32 25 76 0 118 l-21 33 68 33 c75 37 89 53 79 91 -13 54 -135 97 -316 112 -41 3 -194 12 -340 20 -347 18 -524 44 -627 92 -46 21 -81 99 -99 215 -27 180 -15 437 46 983 36 322 36 349 9 423 -47 127 -52 153 -40 192 13 43 86 129 134 158 18 12 62 23 102 27 156 15 453 79 473 101 4 3 -4 4 -18 0 -38 -9 -6 5 160 69 228 89 369 169 518 294 41 33 143 108 227 166 85 58 188 132 229 165 41 33 124 96 183 141 231 175 500 427 624 583 44 56 104 130 134 166 99 116 239 339 342 544 48 97 109 188 253 381 139 186 181 251 232 367 102 228 138 373 164 658 18 199 15 309 -12 437 -24 116 -71 255 -101 299 -14 22 -41 74 -59 116 -17 42 -50 98 -72 125 -22 26 -70 108 -107 181 -36 73 -85 156 -108 185 -23 28 -42 57 -43 62 -1 6 -15 33 -32 60 -61 99 -293 649 -366 867 -84 253 -165 647 -195 952 -14 139 -14 542 -1 677 31 307 119 669 201 831 26 52 47 63 180 97 64 17 169 53 235 81 65 28 168 64 229 79 l112 29 339 -11 c626 -19 716 -14 810 52 23 16 57 34 77 40 73 25 71 53 -10 128 -65 60 -75 65 -208 110 -88 29 -207 81 -320 139 -100 50 -192 95 -205 99 -14 4 -76 34 -138 68 -97 52 -131 78 -242 183 -252 239 -408 312 -680 319 -74 2 -148 1 -165 -1z m-324 -5210 c-35 -14 -65 -23 -68 -21 -5 6 98 46 117 46 8 0 -14 -11 -49 -25z m-3482 -4595 c58 -29 130 -57 160 -63 l53 -11 35 -87 c19 -48 46 -98 59 -111 48 -48 127 -259 222 -598 70 -248 77 -293 62 -419 -19 -169 -99 -612 -112 -625 -2 -3 -40 13 -84 35 -64 33 -99 43 -184 55 -79 12 -123 24 -178 51 -70 34 -74 38 -108 107 -20 40 -50 87 -65 105 -44 49 -75 119 -109 237 -36 130 -54 249 -76 515 -26 313 -11 451 56 524 66 72 73 103 47 198 -16 59 -11 104 15 135 21 26 92 9 207 -48z`);
    }
  
    // icon - element
    const maskIcon = [...el.children].find((x) => getComputedStyle(x, ':before').webkitMaskImage !== 'none');
    if (maskIcon) {
      maskIcon.classList.add('polyglot-setting-icon');
  
      if (!hasAddedMaskIconStyle) {
        const style = document.createElement('style');
        style.appendChild(document.createTextNode(`.polyglot-setting-icon:before {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 14000 14000' height='20' width='20' aria-hidden='true' focusable='false' fill='currentColor' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10775 12614 c-335 -49 -501 -122 -674 -297 l-74 -75 -48 -189 c-106 -418 -175 -879 -221 -1483 -17 -226 -17 -1073 0 -1295 39 -511 105 -884 204 -1160 41 -115 43 -124 42 -230 -2 -124 -26 -222 -89 -360 -36 -79 -131 -231 -160 -255 -12 -10 -33 -8 -118 13 -101 26 -481 84 -712 109 -88 9 -312 13 -830 13 -772 0 -828 -3 -1030 -56 -62 -15 -192 -43 -291 -60 -98 -17 -213 -42 -254 -54 -158 -48 -330 -109 -451 -160 -70 -30 -193 -77 -275 -105 -82 -29 -228 -83 -324 -122 -96 -39 -231 -92 -300 -118 -69 -26 -181 -77 -249 -114 -67 -36 -133 -66 -147 -66 -14 0 -55 -18 -91 -40 -37 -22 -71 -40 -76 -40 -13 0 -278 -100 -322 -123 -22 -11 -62 -34 -90 -52 -27 -18 -78 -44 -112 -58 -59 -24 -144 -82 -226 -154 -24 -22 -47 -33 -67 -33 -46 0 -434 -154 -705 -280 -49 -23 -121 -53 -159 -66 -38 -13 -80 -31 -92 -39 -13 -8 -30 -15 -38 -15 -9 0 -71 -26 -138 -59 -144 -69 -249 -111 -276 -111 -11 0 -30 -8 -43 -18 -13 -10 -49 -33 -79 -51 -30 -18 -82 -59 -116 -91 -52 -50 -68 -59 -110 -65 -54 -8 -105 -34 -174 -89 -25 -20 -49 -36 -55 -36 -5 0 -27 -5 -47 -10 -30 -9 -43 -21 -69 -68 -18 -31 -58 -82 -89 -112 -30 -30 -59 -68 -65 -84 -8 -25 -23 -35 -95 -63 -190 -73 -334 -155 -674 -382 -21 -14 -53 -26 -71 -27 -23 0 -49 -15 -94 -52 -113 -94 -397 -251 -483 -267 -21 -4 -38 -12 -38 -19 0 -6 9 -38 20 -71 19 -56 19 -60 3 -69 -36 -19 -103 -94 -103 -114 0 -33 37 -52 105 -52 81 0 452 59 549 87 12 3 16 1 12 -6 -4 -6 -15 -11 -25 -11 -10 0 -24 -7 -31 -15 -7 -8 -45 -33 -86 -55 -51 -29 -99 -68 -162 -133 -196 -201 -282 -329 -261 -384 l8 -22 68 19 c37 11 88 25 113 31 25 6 57 17 72 25 88 47 509 179 685 214 59 12 131 33 160 46 53 25 217 68 301 79 26 4 90 15 143 26 52 10 221 35 375 55 301 39 457 42 506 10 13 -8 52 -20 88 -26 36 -6 76 -16 88 -21 13 -5 90 -20 172 -33 129 -21 200 -42 546 -157 220 -73 424 -140 454 -150 198 -63 791 -211 915 -229 39 -5 138 -24 220 -41 83 -17 175 -35 205 -39 30 -4 91 -17 135 -28 172 -44 558 -87 756 -83 l136 2 9 -43 c4 -24 8 -209 8 -413 1 -289 4 -379 15 -410 20 -57 8 -294 -23 -463 -41 -220 -70 -305 -136 -397 -73 -101 -90 -135 -90 -180 0 -45 31 -65 144 -95 152 -39 159 -43 305 -185 330 -321 425 -375 631 -362 96 6 207 42 246 78 17 16 27 20 32 12 11 -17 101 -83 128 -93 13 -5 70 -16 125 -25 213 -32 519 -130 633 -204 146 -94 353 -143 456 -108 25 9 45 28 72 69 48 72 76 92 179 124 124 38 138 44 159 72 26 32 25 76 0 118 l-21 33 68 33 c75 37 89 53 79 91 -13 54 -135 97 -316 112 -41 3 -194 12 -340 20 -347 18 -524 44 -627 92 -46 21 -81 99 -99 215 -27 180 -15 437 46 983 36 322 36 349 9 423 -47 127 -52 153 -40 192 13 43 86 129 134 158 18 12 62 23 102 27 156 15 453 79 473 101 4 3 -4 4 -18 0 -38 -9 -6 5 160 69 228 89 369 169 518 294 41 33 143 108 227 166 85 58 188 132 229 165 41 33 124 96 183 141 231 175 500 427 624 583 44 56 104 130 134 166 99 116 239 339 342 544 48 97 109 188 253 381 139 186 181 251 232 367 102 228 138 373 164 658 18 199 15 309 -12 437 -24 116 -71 255 -101 299 -14 22 -41 74 -59 116 -17 42 -50 98 -72 125 -22 26 -70 108 -107 181 -36 73 -85 156 -108 185 -23 28 -42 57 -43 62 -1 6 -15 33 -32 60 -61 99 -293 649 -366 867 -84 253 -165 647 -195 952 -14 139 -14 542 -1 677 31 307 119 669 201 831 26 52 47 63 180 97 64 17 169 53 235 81 65 28 168 64 229 79 l112 29 339 -11 c626 -19 716 -14 810 52 23 16 57 34 77 40 73 25 71 53 -10 128 -65 60 -75 65 -208 110 -88 29 -207 81 -320 139 -100 50 -192 95 -205 99 -14 4 -76 34 -138 68 -97 52 -131 78 -242 183 -252 239 -408 312 -680 319 -74 2 -148 1 -165 -1z m-324 -5210 c-35 -14 -65 -23 -68 -21 -5 6 98 46 117 46 8 0 -14 -11 -49 -25z m-3482 -4595 c58 -29 130 -57 160 -63 l53 -11 35 -87 c19 -48 46 -98 59 -111 48 -48 127 -259 222 -598 70 -248 77 -293 62 -419 -19 -169 -99 -612 -112 -625 -2 -3 -40 13 -84 35 -64 33 -99 43 -184 55 -79 12 -123 24 -178 51 -70 34 -74 38 -108 107 -20 40 -50 87 -65 105 -44 49 -75 119 -109 237 -36 130 -54 249 -76 515 -26 313 -11 451 56 524 66 72 73 103 47 198 -16 59 -11 104 15 135 21 26 92 9 207 -48z'%3E%3C/path%3E%3C/svg%3E");
  transform: rotate(180deg);
}`));
  
        document.body.appendChild(style);
  
        hasAddedMaskIconStyle = true;
      }
    }
  
    sidebar.onclick = () => {
      grab();
  
      console.log(content.children[0].textContent.trim().toLowerCase());
  
      for (const item of sidebar.children) {
        if (item.textContent.trim().toLowerCase() !== content.children[0].textContent.trim().toLowerCase() && item.className === sidebarItemClasses.selected) {
          item.className = sidebarItemClasses.unselected;
  
          // Common attributes to remove
          item.removeAttribute('data-active');
        }
      }
    };
  
    el.onclick = () => {
      grab();
  
      /* for (const item of sidebar.children) {
        if (item.textContent.trim().toLowerCase() === content.children[0].textContent.trim().toLowerCase()) {
          item.className = sidebarItemClasses.unselected;
  
          // Common attributes to remove
          item.removeAttribute('data-active');
        }
  
        if (item.textContent.trim().toLowerCase() === text.trim().toLowerCase()) {
          item.className = sidebarItemClasses.selected;
  
          // Common attributes to set
          item.setAttribute('data-active', true);
        }
      } */
  
      console.log(el);
  
      setTimeout(() => {
        el.className = sidebarItemClasses.selected;
        el.setAttribute('data-active', true);
      }, 10);
  
      const title = content.children[0];

      findTextNodeWithin(title).textContent = text;
      
      [...content.children].filter((x) => x.textContent !== title.textContent).forEach((x) => x.remove());
  
      const childEl = document.createElement('h3');
      childEl.className = content.querySelector('[class*="subheading"]')?.className;
      childEl.textContent = `wow!`;
  
      content.appendChild(childEl);
    };
  
    addThing(el);
  }
  
  const addDivider = () => {
    const el = [...sidebar.children].find((x) => isDivider(x)).cloneNode(true);
  
    addThing(el);
  };
  
  if (sidebarHasDividers) addDivider();
  
  addHeader('polyglot');
  
  addItem('demo');
  addItem('example');
  };
  
  /* setInterval(() => {
    try {
      settingsInject();
    } catch (e) { }
  }, 100); */
  
  settingsInject();
})();