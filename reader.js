(function() {
  var book;
  var rendition;

  function start() {
    var params = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
    var url = params && params.get("url") && decodeURIComponent(params.get("url"));
    var default_book = "//read.sorta.press/books/A%20Half-Century%20of%20Type%20Design%20and%20Typography%20-%201895-1945%20Volume%201.epub";

    // Switch book
    switcher.addEventListener('change', function (e) {
      var switcher = document.getElementById("switcher");
      var url = switcher.options[switcher.selectedIndex].getAttribute('data-level');
      var $nav = document.getElementById("toc");
      var $title = document.getElementById("title");
      var $author = document.getElementById("author");
      var $cover = document.getElementById("cover");
      book.destroy();
      $nav.textContent = '';
      $title.textContent = '';
      $author.textContent = '';
      $cover.textContent = '';
      history.pushState(null, "", location.href.split("?")[0]);
      open( url );
    });

    // Load initial book
    open( default_book )
  }

  function open ( url ) {
        // Load the opf
        book = ePub(url, {
          canonical: function(path) {
            return window.location.origin + window.location.pathname + "?loc=" + path;
          }
        });
        rendition = book.renderTo("viewer", {
          ignoreClass: "annotator-hl",
          width: "100%",
          height: "100%"
        });

        // var hash = window.location.hash.slice(2);
        var loc = window.location.href.indexOf("?loc=");
        if (loc > -1) {
          var href =  window.location.href.slice(loc + 5);
          var hash = decodeURIComponent(href);
        }

        rendition.display(hash || undefined);


        var next = document.getElementById("next");
        next.addEventListener("click", function(e){
          rendition.next();
          e.preventDefault();
        }, false);

        var prev = document.getElementById("prev");
        prev.addEventListener("click", function(e){
          rendition.prev();
          e.preventDefault();
        }, false);

        var nav = document.getElementById("navigation");
        var opener = document.getElementById("opener");
        opener.addEventListener("click", function(e){
          nav.classList.add("open");
        }, false);

        var closer = document.getElementById("closer");
        closer.addEventListener("click", function(e){
          nav.classList.remove("open");
        }, false);

        // Hidden
        var hiddenTitle = document.getElementById("hiddenTitle");

        rendition.on("rendered", function(section){
          var current = book.navigation && book.navigation.get(section.href);

          if (current) {
            document.title = current.label;
          }

          var old = document.querySelectorAll('.active');
          Array.prototype.slice.call(old, 0).forEach(function (link) {
            link.classList.remove("active");
          })

          var active = document.querySelector('a[href="'+section.href+'"]');
          if (active) {
            active.classList.add("active");
          }
          // Add CFI fragment to the history
          history.pushState({}, '', "?loc=" + encodeURIComponent(section.href));
          // window.location.hash = "#/"+section.href
        });

        var keyListener = function(e){

          // Left Key
          if ((e.keyCode || e.which) == 37) {
            rendition.prev();
          }

          // Right Key
          if ((e.keyCode || e.which) == 39) {
            rendition.next();
          }

        };

        rendition.on("keyup", keyListener);
        document.addEventListener("keyup", keyListener, false);

        book.ready.then(function () {
          var $viewer = document.getElementById("viewer");
          $viewer.classList.remove("loading");
        });

        book.loaded.navigation.then(function(toc){
          var $nav = document.getElementById("toc"),
              docfrag = document.createDocumentFragment();

          toc.forEach(function(chapter, index) {
            var item = document.createElement("li");
            var link = document.createElement("a");
            link.id = "chap-" + chapter.id;
            link.textContent = chapter.label;
            link.href = chapter.href;
            item.appendChild(link);
            docfrag.appendChild(item);

            link.onclick = function(){
              var url = link.getAttribute("href");
              rendition.display(url);
              return false;
            };

          });

          $nav.appendChild(docfrag);


        });

        book.loaded.metadata.then(function(meta){
          var $title = document.getElementById("title");
          var $author = document.getElementById("author");
          var $cover = document.getElementById("cover");
          var $nav = document.getElementById('navigation');

          $title.textContent = meta.title;
          $author.textContent = meta.creator;
          if (book.archive) {
            book.archive.createUrl(book.cover)
              .then(function (url) {
                $cover.src = url;
              })
          } else {
            $cover.src = book.cover;
          }

        });

        book.rendition.hooks.content.register(function(contents, view) {

          contents.window.addEventListener('scrolltorange', function (e) {
            var range = e.detail;
            var cfi = new ePub.CFI(range, contents.cfiBase).toString();
            if (cfi) {
              book.rendition.display(cfi);
            }
            e.preventDefault();
          });

        });
  }

  document.addEventListener('DOMContentLoaded', start, false);
})();
