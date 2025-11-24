# Deleting a fragment by an authenticated user should fail
# Likewise, an authenticated user should not be able to delete a fragment authored by a different user

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

# DELETE the fragment using the url without correct authentication should return 401 forbidden

DELETE {{url}}
[BasicAuth]
maliciousUser@email.com:hehehe

HTTP/1.1 401

# Delete the fragment using the url with a different authenticated user should return a 404
# because the current authenticated user did not create that fragment in the url
DELETE {{url}}
[BasicAuth]
kittens@email.com:drowssap


HTTP/1.1 404

