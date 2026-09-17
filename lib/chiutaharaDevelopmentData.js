const sourceStartDate = new Date('2020-05-18');
const sourceRegisteredDate = new Date('2020-06-22');
const legacySourceRegisteredDate = new Date('2016-08-12');
const legacySourceSanctionedDate = new Date('2017-04-15');
const villageAddress = 'Chiutahara Gram Panchayat, Azamgarh, Uttar Pradesh';
const implementingAgency = 'Chiutahara Gram Panchayat';

const rows = [
  ['PRADHAN KA MANDEY', '4th State Finance Commission', 14000, 'Ongoing', 'Administrative & Technical Support'],
  ['INDIA MARKA II HAND PUMP MARMMAT', '4th State Finance Commission', 20000, 'Sanctioned', 'Drinking water'],
  ['INDIA MARKA II HAND PUMP MARMMAT', '4th State Finance Commission', 20000, 'Sanctioned', 'Drinking water'],
  ['INDIA MARKA II HAND PUMP MARMMAT', '4th State Finance Commission', 19500, 'Ongoing', 'Drinking water'],
  ['SAFAI KARMI KIT KRARY', '4th State Finance Commission', 25000, 'Ongoing', 'Sanitation'],
  ['LAUHARA POKHARE PAR GHAT NIRMAN', '4th State Finance Commission', 49500, 'Ongoing', 'Public distribution system'],
  ['PRASHASANIK BYAY', '4th State Finance Commission', 190000, 'Ongoing', 'Administrative & Technical Support'],
  ['SAMUDAYIK SHAUCHALAY NIRMAN AND RUNING WATER KARAY', 'Fourteen Finance Commission', 630000, 'Ongoing', 'Sanitation'],
  ['ANUSUCHIT BASTI GHAT PAR HAND PUMP RIBOR', 'Fourteen Finance Commission', 30000, 'Sanctioned', 'Drinking water'],
  ['NIRMLA KE GHAR EK PAS HAND PUMP RIBOR', 'Fourteen Finance Commission', 30000, 'Sanctioned', 'Drinking water'],
  ['PRATHAMIK VIDYALAY ANUSUCHIT BASTI PAR HAND PUMP RIBOR', 'Fourteen Finance Commission', 30000, 'Sanctioned', 'Drinking water'],
  ['PRADHAN KA MANDEY', '5th State Finance Commission', 21000, 'Ongoing', 'Administrative & Technical Support'],
  ['INDIA MARKA II HAND PUMP MARMMAT', '5th State Finance Commission', 20000, 'Sanctioned', 'Drinking water'],
  ['INDIA MARKA II HAND PUMP MARMMAT', '5th State Finance Commission', 20000, 'Sanctioned', 'Drinking water'],
  ['PRABHUNATH KE GHAR SE CC ROAD TAK KHARNJA NIRMAN', '5th State Finance Commission', 55000, 'Sanctioned', 'Roads'],
  ['DIH BABA KHARNJA SE BUDHIYA KE GHAR TAK KHARNJA NIRMAN', '5th State Finance Commission', 45000, 'Sanctioned', 'Roads'],
  ['PICH SADAK SE JUNAID KE GHAR TAK KHARNJA NIRMAN', '5th State Finance Commission', 4500, 'Sanctioned', 'Roads'],
  ['RAMAWADH KE GHAR SE RAMKER KE GHAR TAK KHARNJA NIRMAN', '5th State Finance Commission', 35000, 'Sanctioned', 'Roads'],
  ['PICH SADAK SE NIHORI RAJBHAR KE GHAR TAK KHARNJA NIRMNA', '5th State Finance Commission', 35000, 'Sanctioned', 'Roads'],
  ['PYARELAL KE GHAR SE VIJAY NATH KE GHAR TAK KHARNJA NIRMAN', '5th State Finance Commission', 35000, 'Sanctioned', 'Roads'],
  ['RADHE SINGH KE GHAR SE RAMPRATAP SINGH KE KHET TAK KHARNJA NIRMAN', '5th State Finance Commission', 75000, 'Sanctioned', 'Roads'],
  ['SHYAMSUNDAR KE GHAR SE RAMPRATAP SINGH KE KHET TAK KHARNJA NIRMAN', '5th State Finance Commission', 125000, 'Sanctioned', 'Roads'],
  ['PICH SADAK SE JAGTAMBA KE GHAR TAK KHARNJA NIRMAN', '5th State Finance Commission', 87000, 'Sanctioned', 'Roads'],
  ['PRASHASANIK BYAY', '5th State Finance Commission', 45000, 'Ongoing', 'Administrative & Technical Support'],
  ['PRATHAMIK VIDYALAY PAR HAND PUMP RIBOR', 'XV Finance Commission', 30000, 'Sanctioned', 'Drinking water'],
  ['JUNIYAR VIDYALAY PAR HAND PUMP RIBOR', 'XV Finance Commission', 30000, 'Sanctioned', 'Drinking water'],
  ['PRATHAMIK VIDYALAY CHIUTAHARA PAR KAYA KALP KE TAHAT KARAY', 'XV Finance Commission', 615000, 'Ongoing', 'Sanitation'],
  ['PRATHAMIK VIDYALAY CHIUTAHARA SC BASTI PAR KAYA KALP KE TAHAT KARAY', 'XV Finance Commission', 671500, 'Ongoing', 'Sanitation'],
  ['ANUSUCHIT BASTI GHAT PAR HAND PUMP RIBOR', 'XV Finance Commission', 31500, 'Ongoing', 'Drinking water'],
  ['NIRMALA KE GHAR KE PAS HAND PUMP RIBOR', 'XV Finance Commission', 30000, 'Sanctioned', 'Drinking water'],
  ['SHAILESH SINGH KE GHAR E RAMSHRI KE GHAR TAK BHUMIGAT NALI NIRMAN', 'XV Finance Commission', 41153, 'Sanctioned', 'Sanitation'],
  ['PRATHAMIK VIDYALAY SC BASTI KPAR BAUNDRYWAL MARMMAT GET NIRMAN', 'XV Finance Commission', 100000, 'Sanctioned', 'Education'],
  ['PRABHUNATH KE GHAR SE RAJESH MAURYA KE GHAR TAK KHARNJA MARMMAT', 'XV Finance Commission', 50000, 'Sanctioned', 'Roads'],
  ['PACHU KE GHAR SE SHIVLAL KE GHAR TAK KHARNJA NIRMAN', 'XV Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['LAUJARI KE GHAR SE PICH ROAD TAK KHARNJA NIRMAN', 'XV Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['PICH ROAD SE GOBARDHAN KE GHAR TAK KHARNJA MARMMAT', 'XV Finance Commission', 50000, 'Sanctioned', 'Roads'],
  ['RAJESH MAURYA KE BAUNDRY SE RAMPRATAP SINGH KE KHET TAK KHARJA NIRMAN', 'XV Finance Commission', 50000, 'Sanctioned', 'Roads'],
  ['PRASHASANIK BYAY', 'XV Finance Commission', 210000, 'Ongoing', 'Administrative & Technical Support'],
  ['HUME PIPE KRAY', 'XV Finance Commission', 69600, 'Ongoing', 'Sanitation'],
  ['SOLAR LIGHT KI MARMMAT', 'XV Finance Commission', 15000, 'Sanctioned', 'Rural electrification']
];

const legacyRows = [
  [3, 'KHARNJA NIRMAN', '4th State Finance Commission', 104712, 'Acquisition', 'Roads'],
  [4, 'KHARNJA NIRMAN', '4th State Finance Commission', 104712, 'Acquisition', 'Roads'],
  [27, 'SOLAR LIGHT', 'Fourteen Finance Commission', 105000, 'Acquisition', 'Rural electrification'],
  [13, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 111848, 'Sanctioned', 'Roads'],
  [15, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 111848, 'Sanctioned', 'Roads'],
  [16, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 111848, 'Abandoned', 'Roads'],
  [6, 'KHARNJA NIRMAN', '4th State Finance Commission', 120900, 'Ongoing', 'Roads'],
  [1, 'NALI NIRMAN', '4th State Finance Commission', 209424, 'Acquisition', 'Roads'],
  [2, 'KHARNJA NIRMAN', '4th State Finance Commission', 209424, 'Acquisition', 'Roads'],
  [5, 'KHARNJA NIRMAN', '4th State Finance Commission', 209424, 'Acquisition', 'Roads'],
  [8, 'NALI NIRMAN', '4th State Finance Commission', 24896, 'Acquisition', 'Sanitation'],
  [9, 'NALI NIRMAN', '4th State Finance Commission', 24896, 'Acquisition', 'Sanitation'],
  [21, 'NALI NIRMAN', 'Fourteen Finance Commission', 24896, 'Acquisition', 'Sanitation'],
  [22, 'NALI NIRMAN', 'Fourteen Finance Commission', 24896, 'Acquisition', 'Sanitation'],
  [10, 'HUME PIPE KARAY', '4th State Finance Commission', 34805, 'Acquisition', 'Sanitation'],
  [23, 'KUP MARMMAT', 'Fourteen Finance Commission', 36500, 'Acquisition', 'Drinking water'],
  [24, 'KUP MARMMAT', 'Fourteen Finance Commission', 36500, 'Sanctioned', 'Drinking water'],
  [25, 'KUP MARMMAT', 'Fourteen Finance Commission', 36500, 'Sanctioned', 'Drinking water'],
  [12, 'PRADHAN KA MANDEY', '4th State Finance Commission', 43000, 'Ongoing', 'Administrative & Technical Support'],
  [11, 'HAND PUMP MARMMAT', '4th State Finance Commission', 49000, 'Sanctioned', 'Drinking water'],
  [7, 'NALI NIRMAN', '4th State Finance Commission', 49792, 'Acquisition', 'Sanitation'],
  [20, 'NALI NIRMAN', 'Fourteen Finance Commission', 49792, 'Acquisition', 'Sanitation'],
  [26, 'SHOKHATA GHADDHA NIRMAN', 'Fourteen Finance Commission', 5000, 'Ongoing', 'Sanitation'],
  [14, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 55924, 'Sanctioned', 'Roads'],
  [17, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 55924, 'Sanctioned', 'Roads'],
  [18, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 55924, 'Sanctioned', 'Roads'],
  [19, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 55924, 'Sanctioned', 'Roads']
];

const additionalRows = [
  [1, 'KHARNJA NIRMAN', '4th State Finance Commission', 209000, 'Ongoing', 'Roads'],
  [2, 'HAND PUMP MARMMAT', '4th State Finance Commission', 15800, 'Ongoing', 'Drinking water']
];

const thirdRows = [
  [1, 'KHARNJA NIRMAN', '4th State Finance Commission', 56846, 'Ongoing', 'Roads', '2017-04-19'],
  [2, 'KHARNJA NIRMAN', '4th State Finance Commission', 120924, 'Acquisition', 'Roads', '2017-04-19'],
  [3, 'KHARNJA NIRMAN', '4th State Finance Commission', 110010, 'Acquisition', 'Roads', '2017-04-19'],
  [4, 'KHARNJA NIRMAN', '4th State Finance Commission', 110010, 'Acquisition', 'Roads', '2017-04-19'],
  [5, 'KHARNJA NIRMAN', '4th State Finance Commission', 59800, 'Ongoing', 'Roads', '2017-04-19'],
  [6, 'KHARNJA NIRMAN', '4th State Finance Commission', 39800, 'Ongoing', 'Roads', '2017-04-19'],
  [7, 'KHARNJA NIRMAN', '4th State Finance Commission', 27372, 'Acquisition', 'Roads', '2017-04-19'],
  [8, 'KHARNJA NIRMAN', '4th State Finance Commission', 32916, 'Acquisition', 'Roads', '2017-04-19'],
  [9, 'KHARNJA NIRMAN', '4th State Finance Commission', 72144, 'Acquisition', 'Roads', '2017-04-19'],
  [10, 'KHARNJA NIRMAN', '4th State Finance Commission', 186930, 'Acquisition', 'Roads', '2017-04-19'],
  [11, 'KHARNJA NIRMAN', '4th State Finance Commission', 164928, 'Acquisition', 'Roads', '2017-04-19'],
  [12, 'HAND PUMP MARMMAT', '4th State Finance Commission', 49920, 'Ongoing', 'Drinking water', '2017-04-19'],
  [13, 'KHARNJA NIRMAN', 'Fourteen Finance Commission', 110790, 'Ongoing', 'Roads', '2017-04-19'],
  [14, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 129800, 'Ongoing', 'Roads', '2017-04-19'],
  [15, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 69500, 'Ongoing', 'Roads', '2017-04-19'],
  [16, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 49500, 'Ongoing', 'Roads', '2017-04-19'],
  [17, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 148400, 'Ongoing', 'Roads', '2017-05-02'],
  [18, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 144288, 'Sanctioned', 'Roads', '2017-05-02'],
  [19, 'KHARNJA NIRMAN', 'Fourteen Finance Commission', 114200, 'Ongoing', 'Roads', '2017-05-02'],
  [20, 'KHARNJA NIRMAN', 'Fourteen Finance Commission', 110010, 'Acquisition', 'Roads', '2017-05-02'],
  [21, 'KHARNJA NIRMAN', 'Fourteen Finance Commission', 168100, 'Ongoing', 'Roads', '2017-05-02'],
  [22, 'NALI NIRMAN', 'Fourteen Finance Commission', 164880, 'Acquisition', 'Sanitation', '2017-05-02'],
  [23, 'NALI NIRMAN', 'Fourteen Finance Commission', 164880, 'Acquisition', 'Sanitation', '2017-05-02'],
  [24, 'NALI NIRMAN', 'Fourteen Finance Commission', 109920, 'Acquisition', 'Sanitation', '2017-05-02'],
  [25, 'CHABUTRA NIRMAN', 'Fourteen Finance Commission', 48752, 'Acquisition', 'Cultural activities', '2017-05-02'],
  [26, 'SHAUCHALAY MARMMAT', 'Fourteen Finance Commission', 20000, 'Sanctioned', 'Sanitation', '2017-05-02'],
  [27, 'SHOKHATA GADDHA NIRMAN', 'Fourteen Finance Commission', 61700, 'Acquisition', 'Sanitation', '2017-05-02'],
  [28, 'SOLAR LIGHT MARMMAT AUR STHAPNA', 'Fourteen Finance Commission', 120000, 'Acquisition', 'Rural electrification', '2017-05-02'],
  [29, 'PRASHASANIK BYAY', 'Fourteen Finance Commission', 50000, 'Ongoing', 'Administrative & Technical Support', '2017-05-02']
];

const fourthRows = [
  [1, 'PRADHAN KA MANDEY', '4th State Finance Commission', 42000, 'Acquisition', 'Administrative & Technical Support', '2017-04-19'],
  [2, 'PRDHAN KA MANDAY', '4th State Finance Commission', 42000, 'Ongoing', 'Administrative & Technical Support', '2017-05-17'],
  [3, 'KHARNJA NIRMAN', 'Fourteen Finance Commission', 156000, 'Acquisition', 'Roads', '2017-10-26'],
  [4, 'KHARNJA NIRMAN', 'Fourteen Finance Commission', 185000, 'Acquisition', 'Roads', '2017-10-26'],
  [5, 'KHARNJA NIRMAN', 'Fourteen Finance Commission', 156000, 'Acquisition', 'Roads', '2017-10-26'],
  [6, 'KHARNJA MARMMAT', 'Fourteen Finance Commission', 85500, 'Ongoing', 'Roads', '2017-10-26'],
  [7, 'KHARNJA NIRMAN', 'Fourteen Finance Commission', 85000, 'Acquisition', 'Roads', '2017-10-26'],
  [8, 'BHUMIGAT NALI NIRMAN', 'Fourteen Finance Commission', 193000, 'Ongoing', 'Sanitation', '2017-10-26'],
  [9, 'BHUMIGAT NALI NIRMAN', 'Fourteen Finance Commission', 185000, 'Acquisition', 'Sanitation', '2017-10-26']
];

const fifthRows = [
  [1, 'KHARNJA NIRMAN', 'Fourteen Finance Commission', 79100, 'Ongoing', 'Roads'],
  [2, 'INDIA MARKA II HAND PUMP RIBOAR', 'Fourteen Finance Commission', 35830, 'Ongoing', 'Drinking water'],
  [3, 'INDIA MARKA II HAND PUMP RIBOAR', 'Fourteen Finance Commission', 35600, 'Sanctioned', 'Drinking water'],
  [4, 'INDIA MARKA II HAND PUMP RIBOAR', 'Fourteen Finance Commission', 35600, 'Sanctioned', 'Drinking water'],
  [5, 'SHAUCHALAY MARMMAT JAL BYAVSHTA', 'Fourteen Finance Commission', 145000, 'Sanctioned', 'Sanitation'],
  [6, 'SHAUCHALAY MARMMAT JAL BYAVSHTA', 'Fourteen Finance Commission', 185500, 'Ongoing', 'Sanitation'],
  [7, 'SHAUCHALAY MARMMAT JAL BYAVSHTA', 'Fourteen Finance Commission', 75000, 'Sanctioned', 'Sanitation'],
  [8, 'TIN SHED NIRMAN', 'Fourteen Finance Commission', 149500, 'Acquisition', 'Education'],
  [9, 'TIN SHED NIRMAN', 'Fourteen Finance Commission', 149500, 'Acquisition', 'Education'],
  [10, 'TIN SHED NIRMAN', 'Fourteen Finance Commission', 14500, 'Acquisition', 'Education']
];

const sixthRows = [
  ['SCHOOL GET', 'Fourteen Finance Commission', 115000, 'Acquisition', 'Education', '2018-06-14'],
  ['SCHOOL FARS MARAMMAT', 'Fourteen Finance Commission', 40300, 'Ongoing', 'Education', '2018-06-14'],
  ['KHARANJA NIRMAN', 'Fourteen Finance Commission', 99000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', 'Fourteen Finance Commission', 156400, 'Ongoing', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', 'Fourteen Finance Commission', 110000, 'Ongoing', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', 'Fourteen Finance Commission', 156400, 'Ongoing', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', 'Fourteen Finance Commission', 115000, 'Acquisition', 'Roads', '2018-06-14'],
  ['NALI NIRMAN', 'Fourteen Finance Commission', 145000, 'Acquisition', 'Sanitation', '2018-06-14'],
  ['NALI NIRMAN', 'Fourteen Finance Commission', 145000, 'Acquisition', 'Sanitation', '2018-06-14'],
  ['NALI NIRMAN', 'Fourteen Finance Commission', 96000, 'Acquisition', 'Sanitation', '2018-06-14'],
  ['NALI NIRMAN', 'Fourteen Finance Commission', 171300, 'Ongoing', 'Sanitation', '2018-06-14'],
  ['NALI NIRMAN', 'Fourteen Finance Commission', 199900, 'Ongoing', 'Sanitation', '2018-06-14'],
  ['NALI NIRMAN', 'Fourteen Finance Commission', 95000, 'Acquisition', 'Sanitation', '2018-06-14'],
  ['NALI NIRMAN', 'Fourteen Finance Commission', 198000, 'Acquisition', 'Sanitation', '2018-06-14'],
  ['DHAKKAN DAR NALI NIRMAN', 'Fourteen Finance Commission', 168000, 'Sanctioned', 'Sanitation', '2018-06-14'],
  ['KHARANJA MARAMMAT', 'Fourteen Finance Commission', 95000, 'Sanctioned', 'Roads', '2018-06-14'],
  ['SCHOOL BOUNDRY/GET MARAMMAT', 'Fourteen Finance Commission', 29300, 'Ongoing', 'Education', '2018-06-14'],
  ['NALA NIRMAN', 'Fourteen Finance Commission', 225000, 'Acquisition', 'Sanitation', '2018-06-14'],
  ['KHARANJA MARAMMAT', 'Fourteen Finance Commission', 54000, 'Ongoing', 'Roads', '2018-06-14'],
  ['CHABUTARA NIRMAN', 'Fourteen Finance Commission', 65000, 'Acquisition', 'Public distribution system', '2018-06-14'],
  ['KUWA MARAMMAT', 'Fourteen Finance Commission', 65000, 'Sanctioned', 'Drinking water', '2018-06-14'],
  ['KUWA MARAMMAT', 'Fourteen Finance Commission', 65000, 'Sanctioned', 'Drinking water', '2018-06-14'],
  ['KUWA MARAMMAT', 'Fourteen Finance Commission', 65000, 'Sanctioned', 'Drinking water', '2018-06-14'],
  ['SHOKHATA', 'Fourteen Finance Commission', 210000, 'Acquisition', 'Sanitation', '2018-06-14'],
  ['SOLAR LIGHT MARAMMAT', 'Fourteen Finance Commission', 400000, 'Sanctioned', 'Rural electrification', '2018-06-14'],
  ['INDIA MARKA II HAND PUMP REBOAR', 'Fourteen Finance Commission', 37200, 'Ongoing', 'Drinking water', '2018-06-14'],
  ['PRASHASNIK VYAY', 'Fourteen Finance Commission', 35000, 'Ongoing', 'Administrative & Technical Support', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 138000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 98000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 85000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 45000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 41000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 115000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 100000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 65000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 185000, 'Acquisition', 'Roads', '2018-06-14'],
  ['KHARANJA NIRMAN', '4th State Finance Commission', 56000, 'Acquisition', 'Roads', '2018-06-14'],
  ['NALI NIRMAN', '4th State Finance Commission', 189000, 'Ongoing', 'Sanitation', '2018-06-14'],
  ['PRADHAN KA MANDEY', '4th State Finance Commission', 68000, 'Ongoing', 'Administrative & Technical Support', '2018-06-14'],
  ['HAND PUMP MARMMAT', '4th State Finance Commission', 650000, 'Ongoing', 'Drinking water', '2018-06-18']
];

const seventhRows = [
  ['PVC PIPE NALI NIRMAN', 'Fourteen Finance Commission', 34200, 'Ongoing', 'Sanitation'],
  ['SOLAR LIGHT STHAPNA', 'Fourteen Finance Commission', 181200, 'Ongoing', 'Rural electrification'],
  ['DAST BEEN STHAPNA', 'Fourteen Finance Commission', 200000, 'Acquisition', 'Sanitation'],
  ['SHAUCHALAY NIRMAN JAL PRABANDHAN', 'Fourteen Finance Commission', 237400, 'Ongoing', 'Sanitation'],
  ['SHAUCHALAY MARMMAT JAL PRABANDHAN', 'Fourteen Finance Commission', 200000, 'Sanctioned', 'Sanitation'],
  ['KHARNJA NIRMAN', 'Fourteen Finance Commission', 75000, 'Acquisition', 'Roads'],
  ['KHARNJA NIRMAN', 'Fourteen Finance Commission', 80000, 'Acquisition', 'Roads'],
  ['HUME PIPE NALI NIRMAN', 'Fourteen Finance Commission', 85000, 'Acquisition', 'Sanitation']
];

const eighthRows = [
  ['PRADHAN KA MANDEY', '4th State Finance Commission', 72000, 'Ongoing', 'Administrative & Technical Support'],
  ['HAND PUMP MARMMAT', '4th State Finance Commission', 80000, 'Ongoing', 'Drinking water'],
  ['CHABUTARA NIRMAN', '4th State Finance Commission', 50000, 'Acquisition', 'Cultural activities'],
  ['NALI MARMMAT', '4th State Finance Commission', 35000, 'Sanctioned', 'Sanitation'],
  ['KHARNJA MARMMAT', '4th State Finance Commission', 15000, 'Sanctioned', 'Roads'],
  ['NALI NIRMAN', '4th State Finance Commission', 45000, 'Acquisition', 'Sanitation'],
  ['KHARNJA NIRMAN', '4th State Finance Commission', 30721, 'Under Approval', 'Roads'],
  ['KHARNJA NIRMAN', '4th State Finance Commission', 17500, 'Acquisition', 'Roads'],
  ['KHARNJA NIRMAN', '4th State Finance Commission', 54700, 'Ongoing', 'Roads'],
  ['KHARNJA NIRMAN', '4th State Finance Commission', 51200, 'Acquisition', 'Roads']
];

const ninthRows = [
  ['KHARNJA NIRMAN', '4th State Finance Commission', 21500, 'Acquisition', 'Roads', '2019-05-18'],
  ['KHARNJA NIRMAN', '4th State Finance Commission', 21200, 'Acquisition', 'Roads', '2019-05-18'],
  ['PRASHASANIK BYAY', '4th State Finance Commission', 35000, 'Acquisition', 'Administrative & Technical Support', '2019-05-18'],
  ['KHARNJA MARMMAT', 'Fourteen Finance Commission', 51200, 'Sanctioned', 'Roads', '2019-05-18'],
  ['KHARNJA MARMMAT', 'Fourteen Finance Commission', 117000, 'Ongoing', 'Roads', '2019-05-18'],
  ['BHUMIGAT NALI NIRMAN', 'Fourteen Finance Commission', 185000, 'Ongoing', 'Sanitation', '2019-05-18'],
  ['BHUMIGHAT NALI NIRMAN', 'Fourteen Finance Commission', 175000, 'Ongoing', 'Sanitation', '2019-05-18'],
  ['KHARNJA NIRMAN', 'Fourteen Finance Commission', 80000, 'Acquisition', 'Roads', '2019-05-18'],
  ['KHARNJA NIRMAN', 'Fourteen Finance Commission', 80000, 'Acquisition', 'Roads', '2019-05-18'],
  ['KHARNJA NIRMAN', 'Fourteen Finance Commission', 110000, 'Acquisition', 'Roads', '2019-05-18'],
  ['KHARNJA NIRMAN', 'Fourteen Finance Commission', 110000, 'Acquisition', 'Roads', '2019-05-18'],
  ['BHUGAT NALI NIRMAN', 'Fourteen Finance Commission', 65800, 'Acquisition', 'Roads', '2019-05-18'],
  ['INDIA MARKA II HAND PUMP RIBOR', 'Fourteen Finance Commission', 35800, 'Ongoing', 'Drinking water', '2019-05-18'],
  ['INDIA MARKA II HAND PUMP RIBOR', 'Fourteen Finance Commission', 30000, 'Sanctioned', 'Drinking water', '2019-05-18'],
  ['INDIA MARKA II HAND PUMP RIBOR', 'Fourteen Finance Commission', 37200, 'Ongoing', 'Drinking water', '2019-05-18'],
  ['BANDRY WAL NALA MARMMAT UDHIKARAN', 'Fourteen Finance Commission', 150000, 'Sanctioned', 'Education', '2019-05-18'],
  ['KHARNJA MARMMAT', 'Fourteen Finance Commission', 80000, 'Sanctioned', 'Roads', '2019-05-18'],
  ['BHUGAT NALI NIRMAN', 'Fourteen Finance Commission', 85000, 'Acquisition', 'Sanitation', '2019-05-18'],
  ['KHARNJA NIRMAN', 'Fourteen Finance Commission', 85000, 'Acquisition', 'Roads', '2019-05-18'],
  ['SOLAR LIGHT MARMMAT', 'Fourteen Finance Commission', 30000, 'Sanctioned', 'Rural electrification', '2019-05-18'],
  ['SOLAR LIGHT NIRMAN', 'Fourteen Finance Commission', 135000, 'Acquisition', 'Rural electrification', '2019-05-18'],
  ['SHOKHATA GADDHA NRIMAN', 'Fourteen Finance Commission', 75000, 'Acquisition', 'Sanitation', '2019-05-18'],
  ['PRASHASANIK BYAY', 'Fourteen Finance Commission', 85000, 'Ongoing', 'Administrative & Technical Support', '2019-05-18'],
  ['SARV RITU SAMPARK MARG', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 210000, 'Sanctioned', 'Roads', '2019-05-18'],
  ['SARV RITU SAMPARK MARG', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 148000, 'Sanctioned', 'Roads', '2019-05-18'],
  ['SARV RITU SAMPARK MARG', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 186000, 'Sanctioned', 'Roads', '2019-05-18'],
  ['BAHA KHUDAI', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 145000, 'Sanctioned', 'Water Conservation', '2019-05-18'],
  ['SAMPRK MARG', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 165300, 'Sanctioned', 'Roads', '2019-05-18'],
  ['MEDBAND KARAY', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 196000, 'Sanctioned', 'Roads', '2019-05-18'],
  ['MEDBAND KARAY', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 186000, 'Sanctioned', 'Roads', '2019-05-18'],
  ['MEDBAND KARAY', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 210000, 'Sanctioned', 'Roads', '2019-05-18'],
  ['SARV RITU SAMPARK MARG', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 156000, 'Sanctioned', 'Roads', '2019-05-18'],
  ['MEDBAND KARAY', 'Viksit Bharat-Guarantee for Rozgar and Ajeevika Mission (Gramin)', 210000, 'Sanctioned', 'Roads', '2019-05-18'],
  ['KHARNJA NIRMAN', 'Fourteen Finance Commission', 90000, 'Ongoing', 'Roads', '2019-07-05'],
  ['INDIA MARKA II HAND PUMP RIBOR', 'Fourteen Finance Commission', 35800, 'Ongoing', 'Drinking water', '2019-07-05'],
  ['KHARNJA MRAMMAT', 'Fourteen Finance Commission', 43000, 'Ongoing', 'Roads', '2019-07-05']
];

const tenthRows = [
  ['KHARNJA NIRMAN', 'Fourteen Finance Commission', 56300, 'Acquisition', 'Roads', '2019-05-18'],
  ['INDIA MARKA II HAND PUMP RIBOR', 'Fourteen Finance Commission', 37200, 'Ongoing', 'Drinking water', '2020-03-16'],
  ['TILES KARAY', 'Fourteen Finance Commission', 185200, 'Sanctioned', 'Education', '2020-03-16'],
  ['INDIA MARKA II HAND PUMP RIBOR', 'Fourteen Finance Commission', 37200, 'Ongoing', 'Drinking water', '2020-03-16'],
  ['FAGING MASHIN KARAY', 'Fourteen Finance Commission', 95000, 'Acquisition', 'Sanitation', '2020-03-16'],
  ['SOLAR LIGHT MARMMAT', 'Fourteen Finance Commission', 85200, 'Sanctioned', 'Rural electrification', '2020-03-16'],
  ['BHUMIGAT NALI NIRMAN', 'Fourteen Finance Commission', 152000, 'Acquisition', 'Sanitation', '2020-03-16'],
  ['BHUMIGAT NALI NIRMAN', 'Fourteen Finance Commission', 96300, 'Acquisition', 'Sanitation', '2020-03-16'],
  ['PRASHASANIK BYAY', 'Fourteen Finance Commission', 35000, 'Acquisition', 'Administrative & Technical Support', '2020-03-16']
];

const eleventhRows = [
  ['AGANBADI KENDRA NIRMAN', '5th State Finance Commission', 350000, 'Ongoing', 'Women and child development'],
  ['PRATHAMIK VIDYALAY SE RATTU KE GHAR TAK HUME PIPE NALI NIRMAN', '5th State Finance Commission', 582000, 'Ongoing', 'Sanitation'],
  ['BAHADUR KE GHAR SE EMIRTI KE GHAR TAK HUME PIPE NALI NIRMAN', '5th State Finance Commission', 582000, 'Ongoing', 'Sanitation'],
  ['RAMSAKAL KE GHAR SE MULCHAND KE GHAR TAK INER LOCKING KARAY', '5th State Finance Commission', 200000, 'Sanctioned', 'Roads'],
  ['PICH SADAK SE HUBRAJ SINGH KE GHAR TAK KHARNJA NIRMAN', '5th State Finance Commission', 55000, 'Sanctioned', 'Roads'],
  ['PANCHAYAT BHAWAN NIRMAN', '5th State Finance Commission', 1000000, 'Ongoing', 'Public distribution system'],
  ['AGANBADI KENDRA NIRMAN', '5th State Finance Commission', 300000, 'Sanctioned', 'Women and child development'],
  ['CAMPOST DUMPING PIT NIRMAN', '5th State Finance Commission', 75000, 'Sanctioned', 'Sanitation'],
  ['PRASHASANIK BYAY', '5th State Finance Commission', 25000, 'Sanctioned', 'Administrative & Technical Support']
];

const twelfthRows = [
  ['MINI STAYDIYAM KE AKHADA NIRMAN', '5th State Finance Commission', 40300, 'Ongoing', 'Public distribution system'],
  ['DARBARI KE GHAR SE SHANKAR KE GHAR TAK KHARNJA NIRMAN', '5th State Finance Commission', 200000, 'Sanctioned', 'Roads'],
  ['PRATHAMIK VIDYALAY ME H B TAK KHARNJA NIRMAN', '4th State Finance Commission', 85000, 'Sanctioned', 'Roads'],
  ['PRASHASANIK BYAY', '4th State Finance Commission', 25000, 'Sanctioned', 'Administrative & Technical Support']
];

const thirteenthRows = [
  ['LOHARA POKHARI PAR GHAT NIRMAN', '4th State Finance Commission', 45000, 'Sanctioned', 'Public distribution system'],
  ['EARSHAD KE GHAR SE RAMNAWAL SINGH KE GHAR TAK KHARNJA NIRMAN', '4th State Finance Commission', 49500, 'Ongoing', 'Roads'],
  ['HUME PIPE KRAY', '4th State Finance Commission', 65000, 'Under Approval', 'Sanitation'],
  ['PRASHASANIK BYAY', '4th State Finance Commission', 25000, 'Sanctioned', 'Administrative & Technical Support']
];

const fourteenthRows = [
  ['PRADHAN KA MANDEY', '4th State Finance Commission', 42000, 'Ongoing', 'Administrative & Technical Support', '2020-01-15'],
  ['INDIA MARKA II HAND PUMP MARMMAT', '4th State Finance Commission', 146500, 'Ongoing', 'Drinking water', '2020-01-15'],
  ['SHOKHATA GADDHA NIRMAN', '4th State Finance Commission', 360000, 'Ongoing', 'Sanitation', '2020-08-25'],
  ['SHOKHATA GADDHA NIRMAN', '4th State Finance Commission', 160500, 'Ongoing', 'Sanitation', '2020-08-25'],
  ['RAJESH KE GHAR KE PAS HAND PUMP RIBOR', '4th State Finance Commission', 186000, 'Ongoing', 'Drinking water', '2020-08-25'],
  ['SHIVLAL KE GHAR KE PAS HAND PUMP RIBOR', '4th State Finance Commission', 30000, 'Sanctioned', 'Drinking water', '2020-08-25'],
  ['RAMBRICHH KE GHAR KE PAS HAND PUMP RIBOR', '4th State Finance Commission', 31500, 'Ongoing', 'Drinking water', '2020-08-25'],
  ['KKRISHAN MANDIR SE DARBARI KE GHAR TAK INTER LOCKING KARAY', '4th State Finance Commission', 99000, 'Sanctioned', 'Roads', '2020-08-31'],
  ['KRISHAN MANDIR SE DARBARI KE GHAR TAK NALI KARAY', '4th State Finance Commission', 85000, 'Sanctioned', 'Sanitation', '2020-08-31'],
  ['GAGUL KE GHAR SE RAMSAKAL KE GHAR TAK NALI NIRMAN', '4th State Finance Commission', 99200, 'Ongoing', 'Sanitation', '2020-08-31'],
  ['RADHE KE TIUBEL SE SATAYDEV KE TIUBEL TAK KHARNJA MARMMAT', '4th State Finance Commission', 80000, 'Sanctioned', 'Roads', '2020-08-31'],
  ['PRASHASANIK BYAY', '4th State Finance Commission', 25000, 'Sanctioned', 'Administrative & Technical Support', '2020-08-31']
];

const fifteenthRows = [
  ['PRASHASNIK BYAY', 'Own Funds', 460000, 'Ongoing', 'Administrative & Technical Support'],
  ['KAYAKALP KE TAHAT KARYA', 'XV Finance Commission', 540000, 'Ongoing', 'Education'],
  ['10 ADAD INDIAMARKA HANDPUMP RIBOR', 'XV Finance Commission', 540000, 'Ongoing', 'Drinking water'],
  ['20 ADAD SOKHATA GADDHA NIRMAR', 'XV Finance Commission', 238076, 'Sanctioned', 'Sanitation']
];

const sixteenthRows = [
  ['KHARNJA MARMMAT', '4th State Finance Commission', 150000, 'Ongoing', 'Roads'],
  ['STREET LIGHT ASTHAPANA KARY', '4th State Finance Commission', 655650, 'Ongoing', 'Rural electrification'],
  ['STREET LIGHT ASTHAPANA KARY', '4th State Finance Commission', 100000, 'Sanctioned', 'Rural electrification'],
  ['HANDPUMP MARMMAT KARYA', '4th State Finance Commission', 100000, 'Sanctioned', 'Drinking water'],
  ['KAYAKALP KE TAHAT KARYA', '4th State Finance Commission', 440000, 'Ongoing', 'Education']
];

const seventeenthRows = [
  ['KUP MARMMAT KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Sanitation'],
  ['SOTI KE KHET SE PWD TAK KHARANJA MARMMAT KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['KARIYA KE GHAR SE HARI GHAR TAK INTER LAKING KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['VIJAYNATH KE GHAR SE RAMPRAVESH KE GHAR TAK INTER LAKING KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['RADHE SINGH KE KHET SE SUKHHU KE MACHIN TAK KHARANJA MARMMAT KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['NIHORI KE GHAR SE KALIMATA MANDIR TAK KHARNJA MARMMAT', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['PACHU KE GHAR SE SHIVLAL KE GHAR TAK KHARANJA NIRMAN KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['MAHENDRA KE GHAR SE PWD TAK HAYUM PIPE NALI NIRMAN KARY', '5th State Finance Commission', 597000, 'Ongoing', 'Sanitation'],
  ['NANDLAL KE MACHIN SE RAMBADAN KE GHAR TAK KHARANJA NIRMAN KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['RAMBADAN KE GHAR SE BHOJU KE GHAR TAK KHARANJA MARMMAT KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['10 ADAD HANDPUMP REBOR', '5th State Finance Commission', 100000, 'Sanctioned', 'Sanitation'],
  ['10 ADAD HAND PUMP REBOR KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Sanitation'],
  ['20 ADAD SOLAR LIGHAT MARMMAT KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Rural electrification'],
  ['10 ADAD SOLAR LIGHAT STHAPANA', '5th State Finance Commission', 100000, 'Sanctioned', 'Rural electrification'],
  ['KALI MATA KA CHABUTARA NIRMAN KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Sanitation'],
  ['PWD SE LALLU KE GHAR INTERLAKING KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['PWD SE RAMDASH KE GHAR TAK HUMEPIPE NALI NIRMAN', '5th State Finance Commission', 170000, 'Ongoing', 'Sanitation'],
  ['KAMRUDDIN KE GHAR SE BAHA TAK HUMEPIPE NALI NIRMAN', '5th State Finance Commission', 100000, 'Sanctioned', 'Sanitation'],
  ['KAMRUDDIN KE GHAR SE BAHA TAK KHARANJA MARMMAT KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['KUCHUNU KE GHAR SE PWD TAK HUME PIPE NALI NIRMAN KARY', '5th State Finance Commission', 1556000, 'Ongoing', 'Sanitation'],
  ['PWD SE GULLAN KE FARM TAK KHARANJA NIRMAN KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['PWD SE JUNAID KE GHAR TAK KHARANJA NIRMAN KARY', '5th State Finance Commission', 100000, 'Sanctioned', 'Roads'],
  ['CHHALLU KE GHAR SE TILAKDHARI KE GHAR TAK HUMEPIPE NALI NIRMAN KARY', '5th State Finance Commission', 736000, 'Ongoing', 'Sanitation'],
  ['PRADHAN MANDEY', '5th State Finance Commission', 120000, 'Ongoing', 'Administrative & Technical Support'],
  ['10 ADAD SOKHATA GADDA NIRMAN', '5th State Finance Commission', 560000, 'Ongoing', 'Sanitation']
];

const eighteenthRows = [
  ['8 ADAD SOLAR LIGHT ASTHAPANA', '5th State Finance Commission', 358000, 'Ongoing', 'Rural electrification'],
  ['PRADHAN KA MANDEY', '5th State Finance Commission', 84000, 'Ongoing', 'Administrative & Technical Support'],
  ['20 ADAD INDIAMARKA HANDPUMP MARMMAT', '5th State Finance Commission', 360000, 'Ongoing', 'Drinking water'],
  ['SAF SAFAI PAR BYAY', '5th State Finance Commission', 720000, 'Ongoing', 'Sanitation']
];

const currentProjects = rows.map(([title, scheme, sanctionedAmount, status, focusedArea], index) => ({
  title,
  description: `Source: Meri Panchayat. Focused area: ${focusedArea}. Registered on 2020-06-22. Sanctioned date 2020-05-18.`,
  scheme,
  financialYear: '2020-2021',
  sanctionedAmount,
  expectedAmount: sanctionedAmount,
  amountSpent: 0,
  wardNo: 0,
  location: { address: villageAddress },
  status,
  physicalProgress: 0,
  registeredOn: sourceRegisteredDate,
  sanctionedDate: sourceStartDate,
  focusedArea,
  startDate: sourceStartDate,
  expectedCompletion: sourceRegisteredDate,
  implementingAgency,
  beneficiaryCount: 'Not provided in source data',
  displayOrder: index + 1
}));

const legacyProjects = legacyRows.map(([sourceNumber, title, scheme, sanctionedAmount, status, focusedArea], index) => ({
  title,
  description: `Source item ${sourceNumber}: Meri Panchayat. Focused area: ${focusedArea}. Registered on ${scheme === 'Fourteen Finance Commission' ? '2016-08-13' : '2016-08-12'}. Sanctioned date 2017-04-15.`,
  scheme,
  financialYear: '2016-2017',
  sanctionedAmount,
  expectedAmount: sanctionedAmount,
  amountSpent: 0,
  wardNo: 0,
  location: { address: villageAddress },
  status,
  physicalProgress: 0,
  registeredOn: scheme === 'Fourteen Finance Commission' ? new Date('2016-08-13') : legacySourceRegisteredDate,
  sanctionedDate: legacySourceSanctionedDate,
  focusedArea,
  startDate: scheme === 'Fourteen Finance Commission' ? new Date('2016-08-13') : legacySourceRegisteredDate,
  expectedCompletion: legacySourceSanctionedDate,
  implementingAgency,
  beneficiaryCount: 'Not provided in source data',
  displayOrder: 101 + index
}));

const additionalProjects = additionalRows.map(([sourceNumber, title, scheme, sanctionedAmount, status, focusedArea], index) => ({
  title,
  description: `Source item ${sourceNumber}: Meri Panchayat. Focused area: ${focusedArea}. Registered on 2016-09-19. Sanctioned date 2017-04-15.`,
  scheme,
  financialYear: '2016-2017',
  sanctionedAmount,
  expectedAmount: sanctionedAmount,
  amountSpent: 0,
  wardNo: 0,
  location: { address: villageAddress },
  status,
  physicalProgress: 0,
  registeredOn: new Date('2016-09-19'),
  sanctionedDate: legacySourceSanctionedDate,
  focusedArea,
  startDate: new Date('2016-09-19'),
  expectedCompletion: legacySourceSanctionedDate,
  implementingAgency,
  beneficiaryCount: 'Not provided in source data',
  displayOrder: 128 + index
}));

const thirdProjects = thirdRows.map(([sourceNumber, title, scheme, sanctionedAmount, status, focusedArea, registeredDate], index) => ({
  title,
  description: `Source item ${sourceNumber}: Meri Panchayat. Focused area: ${focusedArea}. Registered on ${registeredDate}. Sanctioned date 2017-04-15.`,
  scheme,
  financialYear: '2017-2018',
  sanctionedAmount,
  expectedAmount: sanctionedAmount,
  amountSpent: 0,
  wardNo: 0,
  location: { address: villageAddress },
  status,
  physicalProgress: 0,
  registeredOn: new Date(registeredDate),
  sanctionedDate: legacySourceSanctionedDate,
  focusedArea,
  startDate: new Date(registeredDate),
  expectedCompletion: legacySourceSanctionedDate,
  implementingAgency,
  beneficiaryCount: 'Not provided in source data',
  displayOrder: 130 + index
}));

const fourthProjects = fourthRows.map(([sourceNumber, title, scheme, sanctionedAmount, status, focusedArea, registeredDate], index) => ({
  title,
  description: `Source item ${sourceNumber}: Meri Panchayat. Focused area: ${focusedArea}. Registered on ${registeredDate}. Sanctioned date 2017-04-15.`,
  scheme,
  financialYear: '2017-2018',
  sanctionedAmount,
  expectedAmount: sanctionedAmount,
  amountSpent: 0,
  wardNo: 0,
  location: { address: villageAddress },
  status,
  physicalProgress: 0,
  registeredOn: new Date(registeredDate),
  sanctionedDate: legacySourceSanctionedDate,
  focusedArea,
  startDate: new Date(registeredDate),
  expectedCompletion: legacySourceSanctionedDate,
  implementingAgency,
  beneficiaryCount: 'Not provided in source data',
  displayOrder: 160 + index
}));

const fifthProjects = fifthRows.map(([sourceNumber, title, scheme, sanctionedAmount, status, focusedArea], index) => ({
  title,
  description: `Source item ${sourceNumber}: Meri Panchayat. Focused area: ${focusedArea}. Registered on 2017-12-15. Sanctioned date 2017-04-15.`,
  scheme,
  financialYear: '2017-2018',
  sanctionedAmount,
  expectedAmount: sanctionedAmount,
  amountSpent: 0,
  wardNo: 0,
  location: { address: villageAddress },
  status,
  physicalProgress: 0,
  registeredOn: new Date('2017-12-15'),
  sanctionedDate: legacySourceSanctionedDate,
  focusedArea,
  startDate: new Date('2017-12-15'),
  expectedCompletion: legacySourceSanctionedDate,
  implementingAgency,
  beneficiaryCount: 'Not provided in source data',
  displayOrder: 170 + index
}));

const mapLaterRows = (rows, defaultRegisteredDate, financialYear, displayOffset, sanctionedDate = '2017-04-15') => rows.map(([title, scheme, sanctionedAmount, status, focusedArea, registeredDate], index) => {
  const sourceDate = registeredDate || defaultRegisteredDate;
  return {
    title,
    description: `Source: Meri Panchayat. Focused area: ${focusedArea}. Registered on ${sourceDate}. Sanctioned date ${sanctionedDate}.`,
    scheme,
    financialYear,
    sanctionedAmount,
    expectedAmount: sanctionedAmount,
    amountSpent: 0,
    wardNo: 0,
    location: { address: villageAddress },
    status,
    physicalProgress: 0,
    registeredOn: new Date(sourceDate),
    sanctionedDate: new Date(sanctionedDate),
    focusedArea,
    startDate: new Date(sourceDate),
    expectedCompletion: legacySourceSanctionedDate,
    implementingAgency,
    beneficiaryCount: 'Not provided in source data',
    displayOrder: displayOffset + index
  };
});

const sixthProjects = mapLaterRows(sixthRows, '2018-06-14', '2018-2019', 180);
const seventhProjects = mapLaterRows(seventhRows, '2018-09-02', '2018-2019', 220);
const eighthProjects = mapLaterRows(eighthRows, '2019-05-18', '2019-2020', 230);
const ninthProjects = mapLaterRows(ninthRows, '2019-05-18', '2019-2020', 240);
const tenthProjects = mapLaterRows(tenthRows, '2020-03-16', '2019-2020', 280);
const eleventhProjects = mapLaterRows(eleventhRows, '2020-10-23', '2020-2021', 290, '2020-07-08');
const twelfthProjects = mapLaterRows(twelfthRows, '2020-11-09', '2020-2021', 300, '2020-07-21');
const thirteenthProjects = mapLaterRows(thirteenthRows, '2020-12-21', '2020-2021', 310, '2020-09-16');
const fourteenthProjects = mapLaterRows(fourteenthRows, '2020-08-25', '2020-2021', 320, '2020-06-25');
const fifteenthProjects = mapLaterRows(fifteenthRows, '2021-04-23', '2021-2022', 340, '2021-04-23');
const sixteenthProjects = mapLaterRows(sixteenthRows, '2022-01-30', '2021-2022', 350, '2021-09-10');
const seventeenthProjects = mapLaterRows(seventeenthRows, '2021-10-18', '2021-2022', 360, '2021-06-10');
const eighteenthProjects = mapLaterRows(eighteenthRows, '2021-09-11', '2021-2022', 390, '2021-07-01');

const allProjects = [...currentProjects, ...legacyProjects, ...additionalProjects, ...thirdProjects, ...fourthProjects, ...fifthProjects, ...sixthProjects, ...seventhProjects, ...eighthProjects, ...ninthProjects, ...tenthProjects, ...eleventhProjects, ...twelfthProjects, ...thirteenthProjects, ...fourteenthProjects, ...fifteenthProjects, ...sixteenthProjects, ...seventeenthProjects, ...eighteenthProjects];
const uniqueProjects = new Map();

for (const project of allProjects) {
  const key = [
    project.title,
    project.scheme,
    project.registeredOn?.toISOString(),
    project.sanctionedDate?.toISOString(),
    project.expectedAmount,
    project.status,
    project.focusedArea
  ].join('|');

  if (!uniqueProjects.has(key)) uniqueProjects.set(key, project);
}

export const CHIUTAHARA_DEVELOPMENT_PROJECTS = [...uniqueProjects.values()].map((project, index) => ({
  ...project,
  displayOrder: index + 1
}));

export { sourceStartDate, sourceRegisteredDate, legacySourceRegisteredDate, legacySourceSanctionedDate };
