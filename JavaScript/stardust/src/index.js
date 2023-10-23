/// <reference types="@fastly/js-compute" />
import { CacheOverride } from "fastly:cache-override";
import { env } from "fastly:env";
import { includeBytes } from "fastly:experimental";

// Load a static file as a Uint8Array at compile time.
// File path is relative to root of project, not to this file
const welcomePage = includeBytes("./src/welcome-to-compute@edge.html");

// Specify the available backends in an Array for ease of use later
// these should match the origins defined in your service (and toml for any locally defined backends)
const backends = ["origin_0", "origin_1"];

addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  // Log service version
  console.log("FASTLY_SERVICE_VERSION:", env('FASTLY_SERVICE_VERSION') || 'local');
  
  // Get the client request.
  let req = event.request;

  // Filter requests that have unexpected methods.
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return new Response("This method is not allowed", {
      status: 405,
    });
  }

  // Create a cache override.
  let cacheOverride = new CacheOverride("override", { ttl: 60 });

  // Load balancing: pick a backend at random
  let activeBackend = backends[Math.floor(Math.random() * backends.length)];
  console.log("## Active backend is: " + activeBackend);
 
  let url = new URL(req.url);
  // If request is to the `/` path...
  //if ((url.pathname == "/") || (url.pathname == "/test.php")) {
    // simply pass through the reqest to the backend server
    // note: normally you should do some due diligence security and so on, rather than just a straight pass through
    let resp = await fetch( req, {
      backend: activeBackend,
      cacheOverride
    });

    // set a custom header
    resp.headers.append("space-bunnies","are awesome");
  
    return resp;
  //}

  // Catch all other requests and return a 404.
  return new Response("The page you requested could not be found", {
    status: 404,
  });
}
