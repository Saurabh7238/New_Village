# TODO - To Gram panchayat chiutahra (Voter Data)

## Step 1 - Model: extend VoterData schema
- [x] Update models/VoterData.js to store: serial_number, house_no, elector_name, relation_type, relationship/parent_name, svn_no, gender, age
- [x] Keep aliases (voterId, voterName, voterGuardianName, voterGender, voterAge, voterWardNo) to avoid breaking UI

## Step 2 - API consistency (CRUD)
- [x] Update app/api/voter-data/route.js POST/PUT mapping to canonical fields
- [x] Ensure GET returns same shape expected by UI


## Step 3 - Import mapping fixes
- [x] Update app/api/import-gram-panchayat-voters/route.js to map: SVN -> svn_no, house_no separate, relation_type/relationship separate, serial_number correct

## Step 4 - Admin UI updates
- [x] Update app/admin/voters/page.js form + table to show required columns and fields
- [x] Add edit prefill for relation_type/SVN/gender/age


## Step 5 - Display helpers
- [x] Update lib/voterDisplay.js to expose new getters (svn_no, relation_type, relationship)
- [x] Ensure existing getters map to canonical fields

## Step 6 - Testing
- [ ] Run lint/tests/build and do a manual flow check (import -> list -> edit -> save)

