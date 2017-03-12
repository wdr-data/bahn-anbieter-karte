document.addEventListener('DOMContentLoaded', () => {
    // remove click delay on mobile
    FastClick.attach(document.body);

    const positionMap = function(x, y) {
        mapPosition.x = Math.max(Math.min(x, mapXmax), mapXmin);
        mapPosition.y = Math.max(Math.min(y, mapYmax), mapYmin);
        map.style.transform = 'translate(' + mapPosition.x + 'px,' + mapPosition.y + 'px)';
    };
    let mapXmin, mapYmin, mapXmax, mapYmax;
    const scaleMap = function(w) {
        mapPosition.w = w;
        map.style.width = w + 'px';
        mapPosition.h = map.getBoundingClientRect().height;

        mapXmax = 0;
        mapYmax = 0;
        mapXmin = -1 * (mapPosition.w - winWidth);
        mapYmin = -1 * (mapPosition.h - winHeight);

        if(mapPosition.w < winWidth || mapPosition.h < winHeight) {
            if(winRatio > ratio) {
                mapXmax = Math.floor((winWidth - mapPosition.w) / 2);
                mapXmin = Math.floor(mapXmin / 2);
            } else {
                mapYmax = Math.floor((winHeight - mapPosition.h) / 2);
                mapYmin = Math.floor(mapYmin / 2);
            }
        }
    };

    // prepare map layout
    const map = document.getElementById('map');
    const controls = document.getElementById('controls');

    let mapPosition = { x: 0, y: 0, w: 0, h: 0 };
    let ratio = 1;
    let winWidth, winHeight, winRatio;
    const resizeHandler = function() {
        winWidth = window.innerWidth;
        winHeight = window.innerHeight;
        winRatio = winWidth / winHeight;
    };
    window.addEventListener('resize', resizeHandler);

    const zoomListener = function(mod) {
        const width = mapPosition.w + mod;
        if(width < winWidth && width / ratio < winHeight) {
            return;
        }

        const scaleRatio = width / mapPosition.w;

        /**
         * Derived from:
         * oldCenter - newCenter + mapPosition
         * (where newCenter = oldCenter * scaleRatio)
        const x = (winWidth / 2 - mapPosition.x) - (winWidth / 2 - mapPosition.x) * scaleRatio + mapPosition.x;
        const y = (winHeight / 2 - mapPosition.y) - (winHeight / 2 - mapPosition.y) * scaleRatio + mapPosition.y;
         */
        const x = (1-scaleRatio) * (winWidth/2) + scaleRatio * mapPosition.x;
        const y = (1-scaleRatio) * (winHeight/2) + scaleRatio * mapPosition.y;

        scaleMap(width);
        positionMap(x, y);
    };

    const dragListener = function(e) {
        positionMap(mapPosition.x + e.dx, mapPosition.y + e.dy);
    };

    let provider_lines = {};
    let provider_colors = {};
    const make_controls = function() {
        const data = provider_lines;
        const list = controls.getElementsByTagName('ul')[0];
        list.innerHTML = "";
        Object.keys(data).forEach(item => {
            const el = document.createElement('li');
            el.textContent = item;
            const span = document.createElement('span');
            const color = provider_colors[item];
            span.style.backgroundColor = color;
            el.insertBefore(span, el.childNodes[0]);
            el.addEventListener('click', e => {
                chose_provider(e.target.textContent);
            });
            list.appendChild(el);
        });

        // Show all button
        controls.getElementsByClassName('showAll')[0]
            .addEventListener('click', e => {
                chose_provider("");
            });

        // Dropdown functionality
        controls.getElementsByClassName('dropdown')[0]
            .addEventListener('click', e => {
                controls.getElementsByClassName('list')[0].classList.toggle('open');
            });
    };

    const chose_provider = function(key) {
        controls.getElementsByClassName('list')[0].classList.remove('open');

        const svg = map.getSVGDocument();

        Object.keys(provider_lines).forEach(provider => {
            provider_lines[provider].forEach(line => {
                const elem = svg.getElementById(line);
                if(elem) {
                    if(key !== "") {
                        elem.classList.add('disabled');
                    } else {
                        elem.classList.remove('disabled');
                    }
                }
            });
        });

        if(key == "") {
            return;
        }

        provider_lines[key].forEach(line => {
            const elem = svg.getElementById(line);
            if(elem) {
                elem.classList.remove('disabled');
            }
        });
    };

    const init = function() {
        resizeHandler();

        // adjust initial map position
        const mapBB = map.getBoundingClientRect();
        ratio = mapBB.width / mapBB.height;
        if(winRatio > ratio) {
            scaleMap(winHeight * ratio);
        } else {
            scaleMap(winWidth);
        }
        positionMap(mapXmax, mapYmax);

        const target = document.getElementById('map_shield');
        target.addEventListener('wheel', e => {
            e.stopPropagation();
            e.preventDefault();

            zoomListener(-1 * e.deltaY * 2);
        });

        // map dragging
        interact(target)
            .draggable({
                onmove: dragListener
            });

        make_controls();
    };

    Promise.all([
        new Promise(resolve => {
            map.addEventListener('load', () => {
                resolve();
            });
        }),
        fetch('data/provider_lines.json')
            .then(res => res.json())
            .then(data => {
                provider_lines = data;
            }),
        fetch('data/provider_color.json')
            .then(res => res.json())
            .then(data => {
                provider_colors = data;
            })
    ]).then(init);
});