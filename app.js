document.addEventListener('DOMContentLoaded', () => {

    // prepare map layout
    const default_width = 1000;
    let size = default_width;

    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    const map = document.getElementById('map');
    const map_wrapper = document.getElementById('map_wrapper');
    const scrollContainer = document.getElementById('map_scroller');
    const mapTopDist = scrollContainer.getBoundingClientRect().top;
    const target = document.getElementById('map_shield');
    target.addEventListener('wheel', e => {
        if(e.ctrlKey) {
            e.stopPropagation();
            e.preventDefault();

            const oldSize = {
                width: target.getBoundingClientRect().width,
                height: target.getBoundingClientRect().height
            };

            const mod = -1 * e.deltaY * 4;
            console.log(mod);
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
        }
    });

    let provider_lines = {};
    const make_controls = function() {
        const data = provider_lines;
        const container = document.getElementById('controls');
        const list = container.getElementsByTagName('ul')[0];
        list.innerHTML = "";
        Object.keys(data).forEach(item => {
            const el = document.createElement('li');
            el.textContent = item;
            el.addEventListener('click', e => {
                chose_provider(e.target.textContent);
            });
            list.appendChild(el);
        });
    };

    const chose_provider = function(key) {
        const svg = map.getSVGDocument();

        Object.keys(provider_lines).forEach(provider => {
            provider_lines[provider].forEach(line => {
                console.log("Disabling", line);
                const elem = svg.getElementById(line);
                if(elem) {
                    elem.classList.add('disabled');
                }
            });
        });

        provider_lines[key].forEach(line => {
            const elem = svg.getElementById(line);
            console.log("Enabling", line);
            if(elem) {
                elem.classList.remove('disabled');
            }
        });
    };

    // fetch data
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            provider_lines = data;
            make_controls();
        });
});