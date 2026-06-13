# TODO - Import voters (gram-panchayat)

- [x] Add API endpoint: `POST /api/import-gram-panchayat-voters`
- [x] Call endpoint with body: `{ "voters": [ ... ] }`
- [ ] Verify import by fetching `/api/voter-data?type=gram-panchayat`

## Sample payload (JSON)

```json
{
  "voters": [
    {
      "serial_no": 1,
      "house_no": "2",
      "name": "घल्लू पोषण",
      "voter_id": "LLGMFP795",
      "gender": "पुरुष",
      "age": 61
    },
    {
      "serial_no": 2,
      "house_no": "2",
      "name": "नौरंगी",
      "voter_id": "LLGFFP796",
      "gender": "महिला",
      "age": 59
    },
    {
      "serial_no": 3,
      "house_no": "2",
      "name": "बृजेश",
      "voter_id": "LLGMFP797",
      "gender": "पुरुष",
      "age": 41
    },
    {
      "serial_no": 4,
      "house_no": "2",
      "name": "नीतू बृजेश",
      "voter_id": "LLGFFP798",
      "gender": "महिला",
      "age": 39
    },
    {
      "serial_no": 5,
      "house_no": "2",
      "name": "राजेश",
      "voter_id": "LLGMFP799",
      "gender": "पुरुष",
      "age": 33
    },
    {
      "serial_no": 6,
      "house_no": "2",
      "name": "पूनम राजेश",
      "voter_id": "LLGFFP800",
      "gender": "महिला",
      "age": 25
    },
    {
      "serial_no": 7,
      "house_no": "3",
      "name": "बिसमती मोती",
      "voter_id": "LLGFFP802",
      "gender": "महिला",
      "age": 77
    },
    {
      "serial_no": 8,
      "house_no": "3",
      "name": "सूर्यबली मोती",
      "voter_id": "LLGMFP803",
      "gender": "पुरुष",
      "age": 63
    },
    {
      "serial_no": 9,
      "house_no": "3",
      "name": "कमलावती सूर्यबली",
      "voter_id": "LLGFFP804",
      "gender": "महिला",
      "age": 61
    },
    {
      "serial_no": 10,
      "house_no": "3",
      "name": "मुनेसरी राजबली",
      "voter_id": "LLGFFP806",
      "gender": "महिला",
      "age": 57
    }
  ]
}
```

