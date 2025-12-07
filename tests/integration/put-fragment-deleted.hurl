# Attempt to replace a nonexistent fragment 

# step 1: post
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain; charset=utf-8
[BasicAuth]
testaccount1@email.com:password1

# Body of the request goes in ```...``` when it's a string
`This is a fragment!`

# step 2: confirm post

# We expect to get back an HTTP 201
HTTP/1.1 201
# We have various assertions about the response that we want to check
[Asserts]
# The Location header should look like what we expect (including the fragment id)
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
# Our fragment ids use UUIDs, see https://ihateregex.io/expr/uuid/
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
# Our ownerId hash is a hex encoded string
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
# Basic check for the presence of created and updated date strings.
# You could also write a regex for this and use matches
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"
# 19 is the length of our fragment data: 'This is a fragment!'
jsonpath "$.fragment.size" == 19
# Capture the Location URL into a variable named `url`
# also need the id for the put later...
[Captures]
url: header "Location"
id: jsonpath "$.fragment.id" 

# step 3: try to get the fragment

GET {{url}}
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 19
[Asserts]
body == "This is a fragment!"

# step 4: delete the fragment 

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

# step 5 : try to replace the fragment after deletion should return 404

PUT http://localhost:8080/v1/fragments/{{id}}
Content-Type: text/plain; charset=utf-8
[BasicAuth]
testaccount1@email.com:password1

`This is the NEW replaced fragment.`

HTTP/1.1 404
