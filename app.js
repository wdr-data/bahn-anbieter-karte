(function() {
    document.addEventListener('DOMContentLoaded', () => {
        // remove click delay on mobile
        FastClick.attach(document.body);

        const maxWidth = 5000;

        const calcBoxMargins = function(width, height) {
            const ratio = width / height;
            let maxX = 0;
            let maxY = 0;
            let minX = -1 * (width - winWidth);
            let minY = -1 * (height - winHeight);

            if(width < winWidth || height < winHeight) {
                if(winRatio > ratio) {
                    maxX = Math.floor((winWidth - width) / 2);
                    minX = Math.floor(minX / 2);
                } else {
                    maxY = Math.floor((winHeight - height) / 2);
                    minY = Math.floor(minY / 2);
                }
            }

            return {
                maxX: maxX, maxY: maxY, minX: minX, minY: minY
            }
        };

        const transformMap = function() {
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

            const margins = calcBoxMargins(mapPosition.w, mapPosition.h);
            mapXmax = margins.maxX;
            mapYmax = margins.maxY;
            mapXmin = margins.minX;
            mapYmin = margins.minY;
        };

        const scaleMapInit = function() {
            if(winRatio > ratio) {
                scaleMap(winHeight * ratio);
            } else {
                scaleMap(winWidth);
            }
            positionMap(mapXmax, mapYmax);
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

        map.classList.add('animate');
        const animateDuration = getComputedStyle(map).transition.split(' ')[1].replace('s', '')*1000;
        map.classList.remove('animate');

        const chose_provider = function(key) {
            controls.classList.remove('open');

            const svg = map.getSVGDocument();

            Object.keys(provider_lines).forEach(provider => {
                provider_lines[provider].forEach(line => {
                    const elem = svg.getElementById(line);
                    if(elem) {
                        if(key !== "") {
                            elem.className.baseVal = 'disabled';
                        } else {
                            elem.className.baseVal = '';
                        }
                    }
                });
            });

            if(key == "") {
                scaleMapInit();
                return;
            }

            let bounds = {
                left: 0, top: 0, right: mapWidthInit, bottom: mapHeightInit
            };

            provider_lines[key].forEach((line, index) => {
                const elem = svg.getElementById(line);
                if(!elem) {
                    return;
                }

                // remove classes
                elem.className.baseVal = '';

                // update bounds
                const box = elem.getBoundingClientRect();
                ['left', 'top'].forEach(key => {
                    bounds[key] = index == 0 ? box[key] : Math.min(bounds[key], box[key]);
                });
                ['right', 'bottom'].forEach(key => {
                    bounds[key] = index == 0 ? box[key] : Math.max(bounds[key], box[key]);
                });
            });

            // zoom map to bounds
            map.classList.add('animate');
            bounds.width = bounds.right - bounds.left;
            bounds.height = bounds.bottom - bounds.top;
            const scaleX = mapWidthInit / bounds.width;
            const scaleY = mapHeightInit / bounds.height;
            const boundRatio = bounds.width / bounds.height;
            if(winRatio > boundRatio) {
                scaleMap(winHeight * ratio * scaleY);
                bounds.vpWidth = winHeight * boundRatio;
                bounds.vpHeight = winHeight;
            } else {
                scaleMap(winWidth * scaleX);
                bounds.vpWidth = winWidth;
                bounds.vpHeight = winWidth / boundRatio;
            }

            const margins = calcBoxMargins(bounds.vpWidth, bounds.vpHeight);
            positionMap(
                -1 * bounds.left * mapPosition.scale + margins.maxX,
                -1 * bounds.top * mapPosition.scale + margins.maxY
            );

            setTimeout(() => map.classList.remove('animate'), animateDuration);
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
            scaleMapInit();

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