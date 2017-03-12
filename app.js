(function() {
    document.addEventListener('DOMContentLoaded', () => {
        // remove click delay on mobile
        FastClick.attach(document.body);

        const maxWidth = 5000;

        const transformMap = function() {
            //console.log(mapPosition);
            map.style.transform = 'scale(' + mapPosition.scale + ') translate(' + mapPosition.x / mapPosition.scale + 'px,' + mapPosition.y / mapPosition.scale + 'px)';
        };

        const positionMap = function(x, y) {
            mapPosition.x = Math.max(Math.min(x, mapXmax), mapXmin);
            mapPosition.y = Math.max(Math.min(y, mapYmax), mapYmin);
            transformMap();
        };
        let mapXmin, mapYmin, mapXmax, mapYmax, mapWidthInit, mapHeightInit;
        const scaleMap = function(w) {
            mapPosition.w = w;
            mapPosition.scale = w / mapWidthInit;
            transformMap();

            mapPosition.h = mapHeightInit * mapPosition.scale;

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
        const container = document.getElementById('map_scroller');

        let mapPosition = { x: 0, y: 0, w: 0, h: 0, scale: 1 };
        let ratio = 1;
        let winWidth, winHeight, winRatio;
        const resizeHandler = function() {
            const offsetRight = getComputedStyle(container).paddingRight.replace('px', '');
            winWidth = container.getBoundingClientRect().width - offsetRight;
            winHeight = container.getBoundingClientRect().height;
            winRatio = winWidth / winHeight;
        };
        window.addEventListener('resize', resizeHandler);

        const zoomListener = function(mod) {
            const width = mapPosition.w + mod;
            if((width < winWidth && width / ratio < winHeight) || width > maxWidth) {
                return;
            }

            const scaleRatio = width / mapPosition.w;

            scaleMap(width);

            // find cursor offset within the element
            const x = winWidth / 2 - map.getBoundingClientRect().left;
            const y = winHeight / 2 - map.getBoundingClientRect().top;

            // find the final position of the coordinate after scaling
            const xf = x * scaleRatio;
            const yf = y * scaleRatio;

            // find the difference between the initial and final position
            // and add the difference to the current position.
            const dx = mapPosition.x - (xf - x);
            const dy = mapPosition.y - (yf - y);

            positionMap(dx, dy);
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
                    controls.classList.toggle('open');
                });

            document.body.addEventListener('click', e => {
                if(!controls.contains(e.target) || e.target == controls) {
                    controls.classList.remove('open');
                }
            });
        };

        const chose_provider = function(key) {
            controls.classList.remove('open');

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

        const dragListener = function(e) {
            positionMap(mapPosition.x + e.dx, mapPosition.y + e.dy);
        };

        let lastScale = 1;
        const init = function() {
            resizeHandler();

            // adjust initial map position
            const mapBB = map.getBoundingClientRect();
            mapWidthInit = mapBB.width;
            mapHeightInit = mapBB.height;
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

            const hammertime = Hammer(target);
            hammertime.get('pinch').set({ enable: true });
            hammertime.on('pinch', e => {
                const scaleDelta = e.scale - lastScale;
                lastScale = e.scale;

                const mod = scaleDelta * mapPosition.w;
                zoomListener(mod);
            });
            hammertime.on('pinchend', () => {
                lastScale = 1;
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
})();