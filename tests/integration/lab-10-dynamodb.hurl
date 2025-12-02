# Integration test for AWS S3 and Dynamo DB (src/mode/data/aws/*) fragments additions in Lab 10
# POST a fragment to our fragments microservice, requires authentication
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
testaccount1@email.com:password1

`{ "service": "DynamoDB" }`

# Confirm that the server returns a 201, and capture the Location header value to a variable named fragment1_url
# AND capture its id 

HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# GET the fragment metadata you just created using the url as an authorized user.
# Note: don't GET the data for this, already tested in other integration test files
# Note 2: Append /info to these to hit the route GET v1/fragments/:id/info etc.
GET {{fragment1_url}}/info 
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" matches "^application/json"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25

# POST a second markdown fragment

POST http://localhost:8080/v1/fragments

Content-Type: text/markdown
[BasicAuth]
testaccount1@email.com:password1

`DynamoDB is **great**.`

HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# GET the metadata of the second fragment

GET {{fragment2_url}}/info 
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment2_id}}"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

# GET all of the fragments for the same authorized user without expanding them 
# (i.e., just get back the IDs) and confirm that the list of fragments includes the two id values you captured above
GET http://localhost:8080/v1/fragments?expand=0
[BasicAuth]
testaccount1@email.com:password1
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments[*]" contains "{{fragment1_id}}"
jsonpath "$.fragments[*]" contains "{{fragment2_id}}"

# Delete the first fragment

DELETE {{fragment1_url}}
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200

# Confirm fragment no longer exists 

GET {{fragment1_url}}/info 
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 404

GET http://localhost:8080/v1/fragments?expand=0
[BasicAuth]
testaccount1@email.com:password1
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments[*]" not contains "{{fragment1_id}}"
jsonpath "$.fragments[*]" contains "{{fragment2_id}}"
