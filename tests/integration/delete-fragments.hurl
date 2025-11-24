# Integration test for AWS S3 (src/mode/data/aws/*) fragments additions in Lab 9 
# Deleting a fragment by an authenticated user (both existing and nonexistent fragments) 
# If successful (a fragment exists and we are authenticated as its author and request its deletion) return 200 confirmation
# If unsuccessful (we as an authenticated user try to delete a fragment that no longer exists or never existed) return 404 not found


# POST a fragment to our fragments microservice, requires authentication
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: application/json
[BasicAuth]
testaccount1@email.com:password1

`foo`

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

# Confirm that the server returns a 200, that the type of the fragment is application/json

HTTP/1.1 200
Content-Type: application/json; charset=utf-8
Content-Length: 3
[Asserts]
body == "foo"
header "Content-Type" matches "^application/json"

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



# Attempting to delete a nonexistent fragment (for example, the fragment we already deleted) by an authenticated user
# should return a 404 

DELETE {{url}}
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 404
