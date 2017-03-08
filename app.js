document.addEventListener('DOMContentLoaded', () => {
    // remove click delay on mobile
    FastClick.attach(document.body);

    // prepare map layout
    const default_width = 1000;
    let size = default_width;

    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const winRatio = winWidth / winHeight;

    const map = document.getElementById('map');
    const controls = document.getElementById('controls');
    const map_wrapper = document.getElementById('map_wrapper');
    const scrollContainer = document.getElementById('map_scroller');

    let mapPosition = { x: 0, y: 0, w: 0, h: 0 };
    let ratio = 1;
    const positionMap = function(x, y) {
        mapPosition.x = x;
        mapPosition.y = y;
        map.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    };
    const scaleMap = function(w) {
        mapPosition.w = w;
        map.style.width = w + 'px';
        mapPosition.h = map.getBoundingClientRect().height;
    };

    map.addEventListener('load', e => {
        // adjust initial map position
        const mapBB = map.getBoundingClientRect();
        ratio = mapBB.width / mapBB.height;
        if(winRatio > ratio) {
            scaleMap(winHeight * ratio);
            positionMap(Math.floor((winWidth - mapPosition.w) / 2), 0);
        } else {
            scaleMap(winWidth);
            positionMap(0, Math.floor((winHeight - mapPosition.h) / 2));
        }
    });

    const mapTopDist = scrollContainer.getBoundingClientRect().top;
    const target = document.getElementById('map_shield');
    const zoomListener = function(mod) {
        const oldSize = {
            width: target.getBoundingClientRect().width,
            height: target.getBoundingClientRect().height
        };

        if(size + mod < winWidth) {
            return;
        }

        size += mod;
        map_wrapper.style.width = size + 'px';

        // zoom to center of viewport
        const oldCenterX = scrollContainer.scrollLeft + winWidth/2;
        const oldCenterY = document.body.scrollTop - mapTopDist + winHeight;
        const ratioX = oldCenterX / oldSize.width;
        const ratioY = oldCenterY / oldSize.height;
        const newCenterX = size * ratioX;
        const newCenterY = target.getBoundingClientRect().height * ratioY;
        scrollContainer.scrollLeft += (newCenterX - oldCenterX)/2;
        document.body.scrollTop += (newCenterY - oldCenterY)/2;
    };

    target.addEventListener('wheel', e => {
        if(e.ctrlKey) {
            e.stopPropagation();
            e.preventDefault();

            zoomListener(-1 * e.deltaY * 4);
        }
    });

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

    // fetch data
    fetch('data/provider_lines.json')
        .then(res => res.json())
        .then(data => {
            provider_lines = data;
        })
        .then(() => fetch('data/provider_color.json'))
        .then(res => res.json())
        .then(data => {
            provider_colors = data;
        })
        .then(() => {
            make_controls();
        });
});