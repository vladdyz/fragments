# Fragments 1.0 supports CSV to text or JSON conversion 

POST http://localhost:8080/v1/fragments
Content-Type: text/csv
[BasicAuth]
testaccount1@email.com:password1

# This needs to be an actual file, inline text won't work as-is
file, ./test.csv;

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" exists
jsonpath "$.fragment.type" == "text/csv"
[Captures]
id:jsonpath "$.fragment.id"

# to json

GET http://localhost:8080/v1/fragments/{{id}}.json
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"

# to txt 

GET http://localhost:8080/v1/fragments/{{id}}.txt
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/plain; charset=utf-8"

# to csv (just return the unconverted fragment)

GET http://localhost:8080/v1/fragments/{{id}}.csv
[BasicAuth]
testaccount1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/csv; charset=utf-8"
