document.addEventListener('DOMContentLoaded', () => {
    const default_width = 1000;
    let size = default_width;

    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    const map = document.getElementById('map_wrapper');
    const scrollContainer = document.getElementById('map_scoller');
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
            map.style.width = size + 'px';

            // zoom to center of viewport
            const oldCenterX = scrollContainer.scrollLeft + winWidth/2;
            const oldCenterY = document.body.scrollTop - mapTopDist + (winHeight)/2;
            const ratioX = oldCenterX / oldSize.width;
            const ratioY = oldCenterY / oldSize.height;
            const newCenterX = size * ratioX;
            const newCenterY = target.getBoundingClientRect().height * ratioY;
            scrollContainer.scrollLeft += (newCenterX - oldCenterX);
            document.body.scrollTop += (newCenterY - oldCenterY);
        }
    });
});