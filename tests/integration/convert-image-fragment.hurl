# Convert a JPG image to PNG using GET /fragments/:id.ext

# Step 1: Create a JPG fragment (IMPORTANT NOTE: the image must be in same dir as test otherwise it requires explicit permissions)
POST http://localhost:8080/v1/fragments
Content-Type: image/jpeg
[BasicAuth]
testaccount1@email.com:password1

file, ./space.jpg;

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" exists
[Captures]
id:jsonpath "$.fragment.id"

# Step 2: Use the sharp image converter
GET http://localhost:8080/v1/fragments/{{id}}.png
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "image/png"

# Converting an image-based fragment to text-based is not supported
GET http://localhost:8080/v1/fragments/{{id}}.txt
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 415
