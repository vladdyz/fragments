# conversion of application fragments (YAML/JSON)

# Step 1: Create a JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
testaccount1@email.com:password1

`{ "test": true }`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" exists
jsonpath "$.fragment.type" == "application/json"
[Captures]
id:jsonpath "$.fragment.id"

# step 2: json to yml test 

GET http://localhost:8080/v1/fragments/{{id}}.yaml
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "application/yaml; charset=utf-8"

# step 3: Converting to text is also supported
GET http://localhost:8080/v1/fragments/{{id}}.txt
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200

# step 4: Converting to an unsupported type returns the fragment as its original type without a conversion
GET http://localhost:8080/v1/fragments/{{id}}.md
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
body == `{ "test": true }`

# step 5: YAML to JSON

POST http://localhost:8080/v1/fragments
Content-Type: application/yaml 
[BasicAuth]
testaccount1@email.com:password1

`jobs: test`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" exists
jsonpath "$.fragment.type" == "application/yaml"
[Captures]
id:jsonpath "$.fragment.id"


GET http://localhost:8080/v1/fragments/{{id}}.json
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"

