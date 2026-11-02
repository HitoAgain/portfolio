# Dev server: like `python -m http.server 5517`, but tells the browser to re-check every file,
# so edited pages show up on a normal refresh instead of a stale cached copy.
import functools, http.server, os


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


handler = functools.partial(NoCache, directory=os.path.dirname(os.path.abspath(__file__)))
print('http://localhost:5517')
http.server.ThreadingHTTPServer(('', 5517), handler).serve_forever()
