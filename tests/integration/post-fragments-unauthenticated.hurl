# Trying to post a fragment without any authentication should fail and produce a 401 response
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain

HTTP/1.1 401

# Expanding on this, using the wrong authentication instead of missing authentication should reproduce the response

POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
unregistereduser@email.com:wrongpassword

HTTP/1.1 401
