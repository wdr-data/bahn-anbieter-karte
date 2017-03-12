(function() {
    // Get the modal
    const modal = document.getElementById('myModal');

    // Get the button that opens the modal
    const btn = document.getElementById("myIcn");

    // Get the <span> element that closes the modal
    const span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal
    btn.onclick = function() {
        modal.classList.add("open");
    };
    btn.addEventListener('keypress', function(e) {
        if(e.keyCode == 13 || e.keyCode == 32) {
            modal.classList.add("open");
        }
    });

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.classList.remove("open");
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.classList.remove("open");
        }
    };
})();
