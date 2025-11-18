# Posting an unsupported fragment type should return a 415 error

POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: application/exe
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 415
# Confirm that the status and error object is as expected 
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" == "Invalid unsupported type"
