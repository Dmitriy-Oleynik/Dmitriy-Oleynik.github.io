(function () {
  "use strict";
  /* global importScripts */
  /* global self */
  /* global caches */
  /* global fetch */
  /* global URL */


  // Include SW cache polyfill
  importScripts("/js/serviceworker-cache-polyfill.js");


  // Cache name definitions
  var cacheNameStatic = "static-v4";
  var cacheNameWikipedia = "wikipedia-v1";  

  var currentCacheNames = [
    cacheNameStatic,
    cacheNameWikipedia,    
  ];


  // A new ServiceWorker has been registered
  self.addEventListener("install", function (event) {
    event.waitUntil(
      caches.open(cacheNameStatic)
        .then(function (cache) {
          return cache.addAll([
            "/",
            "/js/app.js",
            "/css/app.css",
            "/img/loading.svg"
          ]);
        })
    );
  });


  // A new ServiceWorker is now active
  self.addEventListener("activate", function (event) {
    event.waitUntil(
      caches.keys()
        .then(function (cacheNames) {
          return Promise.all(
            cacheNames.map(function (cacheName) {
              if (currentCacheNames.indexOf(cacheName) === -1) {
                // TODO: if wikipedia cache changed, remove localStorage history
                return caches.delete(cacheName);
              }
            })
          );
        })
    );
  });


  // The page has made a request
  self.addEventListener("fetch", function (event) {
    var requestURL = new URL(event.request.url);

    event.respondWith(
      caches.match(event.request)
        .then(function (response) {

          if (response) {
            return response;
          }

          var fetchRequest = event.request.clone();

          return fetch(fetchRequest).then(
            function (response) {

              var shouldCache = false;

              if (response.type === "basic" && response.status === 200) {
                shouldCache = cacheNameStatic;
              } else if (response.type === "opaque") { // if response isn"t from our origin / doesn"t support CORS
                if (requestURL.hostname.indexOf(".wikipedia.org") > -1) {
                  shouldCache = cacheNameWikipedia;
                } else {
                  // just let response pass through, don"t cache
                }

              }

              if (shouldCache) {
                var responseToCache = response.clone();

                caches.open(shouldCache)
                  .then(function (cache) {
                    var cacheRequest = event.request.clone();
                    cache.put(cacheRequest, responseToCache);
                  });
              }

              return response;
            }
          );
        })
    );
  });

})();
