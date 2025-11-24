# Integration test for AWS S3 (src/mode/data/aws/*) fragments additions in Lab 9


# POST a fragment to our fragments microservice, requires authentication
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain
[BasicAuth]
testaccount1@email.com:password1

`Hello S3!`

# Confirm that the server returns a 201, and capture the Location header value to a variable named url

HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
[Captures]
url: header "Location"

# GET the fragment you just created using the url as an authorized user.
GET {{url}}
[BasicAuth]
testaccount1@email.com:password1

# Confirm that the server returns a 200, that the type of the fragment is text/plain, and that the body is equal to Hello S3!

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 9 # "Hello S3!" 
[Asserts]
body == "Hello S3!"
header "Content-Type" matches "^text/plain"

# DELETE the fragment using the url as an authorized user

DELETE {{url}}
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200 # Confirm that the server returns a 200.

# Try to GET the fragment again using the url as an authorized user.
# Confirm that the server returns a 404, since the fragment should be deleted

GET {{url}}
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 404
