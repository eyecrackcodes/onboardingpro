# Interstate Background Research, Inc. - Background Request XML Specification

**Version 1.14**  
**Automated Background Request Submissions via XML**

© Copyright 2009-2025 Interstate Background Research, Inc. All rights reserved.

---

## API Configuration

```bash
IBR_API_USERNAME="ApAttonLL"
IBR_API_PASSWORD="G4#tPkM7@qTT"
IBR_API_VENDOR="your-ibr-vendor"
IBR_API_URL="https://soap.services.ibrtest.com/ws/services/StandardReportingService"
```

**Default Package**: Package 2

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [XML Background Request DTD](#2-xml-background-request-dtd)
3. [XML Background Request Elements](#3-xml-background-request-elements)
4. [XML Background Request Examples](#4-xml-background-request-examples)
5. [XML Background Request Loader DTD](#5-xml-background-request-loader-dtd)
6. [XML Background Request Loader Elements](#6-xml-background-request-loader-elements)
7. [XML Background Request Loader Example](#7-xml-background-request-loader-example)
8. [XML Response DTD](#8-xml-response-dtd)
9. [XML Response Elements](#9-xml-response-elements)
10. [XML Response Example](#10-xml-response-example)

---

## 1. Introduction

The IBR XML API allows automated submission and retrieval of background check requests. The system uses XML documents that conform to specific DTDs for requests, responses, and loader operations.

### 1.1. Dataflow
1. Submit background check requests via XML using the request DTD
2. Receive batch confirmation via loader XML response
3. Check status and retrieve completed results via response XML

### 1.2. Unicode
All XML documents use UTF-8 encoding as specified in the XML declaration.

### 1.3. API-Key
Authentication is handled via username/password credentials in the SOAP service.

### 1.4. HTTP Post
Requests are submitted to the SOAP endpoint: `https://soap.services.ibrtest.com/ws/services/StandardReportingService`

---

## 2. XML Background Request DTD

```xml
<?xml version="1.0" encoding="UTF-8"?>

<!ELEMENT IBR (BATCHID,REQUESTS)>
<!ELEMENT BATCHID (#PCDATA)>
<!ELEMENT REQUESTS (REQUEST)*>

<!ELEMENT REQUEST (TYPE,NAME,ALIASES?,DOB?,SSN,EMAIL?,EMAIL_REPORT?,PHONE?,ADDRESS?,GENDER?,PREVADDRESSES?,DRIVERS_LICENSE?,EDUCATION?,EMPLOYMENT?)>
<!ELEMENT TYPE (ORDER,SUBCOMPANY?,CLIENTID?)>
<!ELEMENT ORDER (#PCDATA)*>
<!ELEMENT SUBCOMPANY (#PCDATA)*>
<!ELEMENT CLIENTID (#PCDATA)*>

<!ELEMENT NAME (LAST,MIDDLE?,FIRST?)>
<!ELEMENT ALIASES (ALIAS)*>
<!ELEMENT ALIAS (LAST,MIDDLE?,FIRST?)>
<!ELEMENT LAST (#PCDATA)*>
<!ELEMENT MIDDLE (#PCDATA)*>
<!ELEMENT FIRST (#PCDATA)*>

<!ELEMENT DOB (#PCDATA)*>
<!ELEMENT SSN (#PCDATA)*>
<!ELEMENT EMAIL (#PCDATA)*>
<!ELEMENT EMAIL_REPORT (#PCDATA)*>
<!ELEMENT PHONE (#PCDATA)*>

<!ELEMENT ADDRESS (ADDR1,ADDR2?,CITY,STATE,COUNTY?,ZIPCODE)>
<!ELEMENT ADDR1 (#PCDATA)*>
<!ELEMENT ADDR2 (#PCDATA)*>
<!ELEMENT CITY (#PCDATA)*>
<!ELEMENT STATE (#PCDATA)*>
<!ELEMENT COUNTY (#PCDATA)*>
<!ELEMENT ZIPCODE (#PCDATA)*>

<!ELEMENT GENDER (#PCDATA)*>
<!ELEMENT PREVADDRESSES (PREVADDRESS)*>
<!ELEMENT PREVADDRESS (ADDR1,ADDR2?,CITY,STATE,COUNTY?,ZIPCODE, START_DATE?, END_DATE?)>
<!ELEMENT START_DATE (#PCDATA)*>
<!ELEMENT END_DATE (#PCDATA)*>

<!ELEMENT DRIVERS_LICENSE (STATE,NUMBER)>
<!ELEMENT NUMBER (#PCDATA)*>

<!ELEMENT EDUCATION (SCHOOL)*>
<!ELEMENT SCHOOL (SCHOOL_NAME,CITY,STATE,PHONE?,START_DATE,END_DATE,DIPLOMA)>
<!ELEMENT SCHOOL_NAME (#PCDATA)*>
<!ELEMENT DIPLOMA (#PCDATA)*>

<!ELEMENT EMPLOYMENT (EMPLOYER)*>
<!ELEMENT EMPLOYER (EMPLOYER_NAME,ADDR1?,CITY,STATE,PHONE?,POSITION,SUPERVISOR?,START_DATE,END_DATE?,REASON?,CONTACT,RELEASE)>

<!ELEMENT EMPLOYER_NAME (#PCDATA)*>
<!ELEMENT POSITION (#PCDATA)*>
<!ELEMENT SUPERVISOR (#PCDATA)*>
<!ELEMENT REASON (#PCDATA)*>
<!ELEMENT CONTACT (#PCDATA)*>
<!ELEMENT RELEASE (#PCDATA)*>
```

---

## 3. XML Background Request Elements

### 3.1. IBR
Root element containing the batch ID and requests collection.

### 3.2. REQUESTS
Container for one or more REQUEST elements.

#### 3.2.1. TYPE
Specifies the background check package and client information:
- **ORDER**: Package name (e.g., "Package 1", "Package 2", "Credit")
- **SUBCOMPANY**: Optional subcompany identifier
- **CLIENTID**: Optional client identifier for tracking

#### 3.2.2. REQUEST
Individual background check request containing:

##### 3.2.2.1. NAME
Required name information:
- **LAST**: Last name (required)
- **FIRST**: First name (optional)
- **MIDDLE**: Middle name/initial (optional)

##### 3.2.2.2. ALIASES
Optional collection of alternate names with same structure as NAME.

##### 3.2.2.3. ADDRESS
Current address information:
- **ADDR1**: Primary address line (required)
- **ADDR2**: Secondary address line (optional)
- **CITY**: City (required)
- **STATE**: State abbreviation (required)
- **COUNTY**: County name (optional)
- **ZIPCODE**: ZIP code (required)

##### 3.2.2.4. PREVADDRESSES
Collection of previous addresses with same structure as ADDRESS plus:
- **START_DATE**: Move-in date (MMYYYY format)
- **END_DATE**: Move-out date (MMYYYY format)

##### 3.2.2.5. Personal Information
- **DOB**: Date of birth (MMDDYYYY format)
- **SSN**: Social Security Number
- **GENDER**: M/F
- **EMAIL**: Email address
- **PHONE**: Phone number

##### 3.2.2.6. DRIVERS_LICENSE
Driver's license information:
- **STATE**: Issuing state
- **NUMBER**: License number

##### 3.2.2.7. EDUCATION
Collection of educational institutions:
- **SCHOOL_NAME**: Name of school
- **CITY**: School city
- **STATE**: School state
- **PHONE**: School phone number
- **START_DATE**: Enrollment start (MMYYYY)
- **END_DATE**: Graduation/end date (MMYYYY)
- **DIPLOMA**: Y/N if diploma/degree received

##### 3.2.2.8. EMPLOYMENT
Collection of employment history:
- **EMPLOYER_NAME**: Company name
- **ADDR1**: Company address
- **CITY**: Company city
- **STATE**: Company state
- **PHONE**: Company phone
- **POSITION**: Job title
- **SUPERVISOR**: Supervisor name
- **START_DATE**: Employment start (MMYYYY)
- **END_DATE**: Employment end (MMYYYY)
- **REASON**: Reason for leaving
- **CONTACT**: Y/N if employer may be contacted
- **RELEASE**: Y/N if release form signed

---

## 4. XML Background Request Examples

### Basic Request (Package 1)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE IBR SYSTEM 'ibr_request1.dtd'>
<IBR>
    <BATCHID>04/02/2009 07:15:23</BATCHID>
    <REQUESTS>
        <REQUEST>
            <TYPE>
                <ORDER>Package 1</ORDER>
            </TYPE>
            <NAME>
                <LAST>Testing</LAST>
                <MIDDLE>J</MIDDLE>
                <FIRST>Sylvester</FIRST>
            </NAME>
            <DOB>04011999</DOB>
            <SSN>555001234</SSN>
            <ADDRESS>
                <ADDR1>1234 Main Street</ADDR1>
                <CITY>Tampa</CITY>
                <STATE>FL</STATE>
                <COUNTY>Hillsborough</COUNTY>
                <ZIPCODE>34615</ZIPCODE>
            </ADDRESS>
            <GENDER>M</GENDER>
        </REQUEST>
    </REQUESTS>
</IBR>
```

### Comprehensive Request (Package 2)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE IBR SYSTEM 'ibr_request1.dtd'>
<IBR>
    <BATCHID>04/02/2009 07:15:23</BATCHID>
    <REQUESTS>
        <REQUEST>
            <TYPE>
                <ORDER>Package 2</ORDER>
                <SUBCOMPANY>Parent Company</SUBCOMPANY>
                <CLIENTID>1701</CLIENTID>
            </TYPE>
            <NAME>
                <LAST>Kirk</LAST>
                <MIDDLE>T</MIDDLE>
                <FIRST>James</FIRST>
            </NAME>
            <DOB>11021951</DOB>
            <SSN>000001231</SSN>
            <ADDRESS>
                <ADDR1>715 Locust St.</ADDR1>
                <CITY>Des Moines</CITY>
                <STATE>IA</STATE>
                <ZIPCODE>50309</ZIPCODE>
            </ADDRESS>
            <GENDER>M</GENDER>
            <PREVADDRESSES>
                <PREVADDRESS>
                    <ADDR1>123 Main Street</ADDR1>
                    <CITY>Tampa</CITY>
                    <STATE>FL</STATE>
                    <ZIPCODE>34615</ZIPCODE>
                    <START_DATE>022009</START_DATE>
                    <END_DATE>112009</END_DATE>
                </PREVADDRESS>
            </PREVADDRESSES>
            <EDUCATION>
                <SCHOOL>
                    <SCHOOL_NAME>Lincoln High School</SCHOOL_NAME>
                    <CITY>Des Moines</CITY>
                    <STATE>IA</STATE>
                    <PHONE>515-242-7500</PHONE>
                    <START_DATE>041964</START_DATE>
                    <END_DATE>111968</END_DATE>
                    <DIPLOMA>Y</DIPLOMA>
                </SCHOOL>
                <SCHOOL>
                    <SCHOOL_NAME>Star Fleet Academy</SCHOOL_NAME>
                    <CITY>San Francisco</CITY>
                    <STATE>CA</STATE>
                    <START_DATE>111968</START_DATE>
                    <END_DATE>041970</END_DATE>
                    <DIPLOMA>Y</DIPLOMA>
                </SCHOOL>
            </EDUCATION>
            <EMPLOYMENT>
                <EMPLOYER>
                    <EMPLOYER_NAME>Star Fleet</EMPLOYER_NAME>
                    <ADDR1></ADDR1>
                    <CITY>San Francisco</CITY>
                    <STATE>CA</STATE>
                    <PHONE>1-800-282-9500</PHONE>
                    <POSITION>Starship Captain</POSITION>
                    <SUPERVISOR>Admiral Fitzipatrick</SUPERVISOR>
                    <START_DATE>041970</START_DATE>
                    <REASON>n/a</REASON>
                    <CONTACT>N</CONTACT>
                    <RELEASE>Y</RELEASE>
                </EMPLOYER>
            </EMPLOYMENT>
        </REQUEST>
    </REQUESTS>
</IBR>
```

---

## 5. XML Background Request Loader DTD

```xml
<?xml version="1.0" encoding="UTF-8"?>

<!ELEMENT IBR (TIMESTAMP,RESPONSES)>
<!ELEMENT TIMESTAMP (#PCDATA)>
<!ELEMENT RESPONSES (RESPONSE)*>

<!ELEMENT RESPONSE (BATCHID,SEQUENCE,CLIENTID?,IBR_ID?,ERROR?)>
<!ELEMENT BATCHID (#PCDATA)*>
<!ELEMENT SEQUENCE (#PCDATA)*>
<!ELEMENT CLIENTID (#PCDATA)*>
<!ELEMENT IBR_ID (#PCDATA)*>
<!ELEMENT ERROR (#PCDATA)*>
```

---

## 6. XML Background Request Loader Elements

### 6.1. IBR
Root element for loader responses containing timestamp and responses.

### 6.2. RESPONSES
Collection of response elements indicating the status of submitted requests.

#### 6.2.1. RESPONSE
Individual response for each submitted request:
- **BATCHID**: Original batch identifier
- **SEQUENCE**: Order of request in batch
- **CLIENTID**: Client identifier (if provided)
- **IBR_ID**: Assigned IBR tracking ID (if successful)
- **ERROR**: Error message (if submission failed)

---

## 7. XML Background Request Loader Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE IBR SYSTEM 'ibr_loader1.dtd'>
<IBR>
    <TIMESTAMP>04/02/2010 07:30:01</TIMESTAMP>
    <RESPONSES>
        <RESPONSE>
            <BATCHID>04/02/2009 07:15:23</BATCHID>
            <SEQUENCE>1</SEQUENCE>
            <IBR_ID>2048</IBR_ID>
        </RESPONSE>
        <RESPONSE>
            <BATCHID>04/02/2009 07:15:23</BATCHID>
            <SEQUENCE>2</SEQUENCE>
            <CLIENTID>1701</CLIENTID>
            <IBR_ID>2049</IBR_ID>
        </RESPONSE>
        <RESPONSE>
            <BATCHID>04/02/2009 07:15:23</BATCHID>
            <SEQUENCE>3</SEQUENCE>            
            <CLIENTID>2050</CLIENTID>
            <ERROR>Invalid Report 'Package 11' given (Valid order names: 'Package 1', 'Package 2', 'Credit')
Invalid STATE 'ZR' given</ERROR>
        </RESPONSE>        
    </RESPONSES>
</IBR>
```

---

## 8. XML Response DTD

```xml
<?xml version="1.0" encoding="UTF-8"?>

<!ELEMENT IBR (TIMESTAMP,RESPONSES)>
<!ELEMENT TIMESTAMP (#PCDATA)>
<!ELEMENT RESPONSES (RESPONSE)*>

<!ELEMENT RESPONSE (BATCHID,IBR_ID,CLIENTID?,SUBMITTED,COMPLETED,STATUS,EXTENDEDSTATUSES?)>
<!ELEMENT BATCHID (#PCDATA)*>
<!ELEMENT IBR_ID (#PCDATA)*>
<!ELEMENT CLIENTID (#PCDATA)*>
<!ELEMENT SUBMITTED (#PCDATA)*>
<!ELEMENT COMPLETED (#PCDATA)*>
<!ELEMENT STATUS (#PCDATA)*>

<!ELEMENT EXTENDEDSTATUSES (EXTENDEDSTATUS)*>
<!ELEMENT EXTENDEDSTATUS (SECTION,STATUS)*>
<!ELEMENT SECTION (#PCDATA)*>
```

---

## 9. XML Response Elements

### 9.1. IBR
Root element for status and completed background check responses.

### 9.2. RESPONSES
Collection of response elements with completion status and results.

#### 9.2.1. RESPONSE
Individual completed background check response:
- **BATCHID**: Original batch identifier
- **IBR_ID**: IBR tracking ID
- **CLIENTID**: Client identifier (if provided)
- **SUBMITTED**: Submission timestamp
- **COMPLETED**: Completion timestamp
- **STATUS**: Overall status (P=Pass, F=Fail, R=Review)
- **EXTENDEDSTATUSES**: Detailed status by section

##### 9.2.1.1. EXTENDEDSTATUSES
Collection of section-specific statuses:
- **SECTION**: Background check section (Credit, Federal, PDB, etc.)
- **STATUS**: Section status (P=Pass, F=Fail, R=Review)

---

## 10. XML Response Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE IBR SYSTEM 'ibr_response1.dtd'>
<IBR>
    <TIMESTAMP>04/03/2010 17:30:01</TIMESTAMP>
    <RESPONSES>
        <RESPONSE>
            <BATCHID>04/02/2009 07:15:23</BATCHID>
            <IBR_ID>2048</IBR_ID>
            <SUBMITTED>04/02/2009 07:01:02</SUBMITTED>
            <COMPLETED>04/03/2009 09:17:45</COMPLETED>
            <STATUS>F</STATUS>
            <EXTENDEDSTATUSES>
                <EXTENDEDSTATUS>
                    <SECTION>Credit</SECTION>
                    <STATUS>F</STATUS>
                </EXTENDEDSTATUS>
                <EXTENDEDSTATUS>
                    <SECTION>Federal</SECTION>
                    <STATUS>P</STATUS>
                </EXTENDEDSTATUS>
                <EXTENDEDSTATUS>
                    <SECTION>PDB</SECTION>
                    <STATUS>R</STATUS>
                </EXTENDEDSTATUS>
            </EXTENDEDSTATUSES>
        </RESPONSE>
        <RESPONSE>
            <BATCHID>04/02/2009 07:15:23</BATCHID>
            <IBR_ID>2049</IBR_ID>
            <CLIENTID>1701</CLIENTID>
            <SUBMITTED>04/02/2009 07:01:03</SUBMITTED>
            <COMPLETED>04/02/2009 11:02:13</COMPLETED>
            <STATUS>P</STATUS>
            <EXTENDEDSTATUSES>
                <EXTENDEDSTATUS>
                    <SECTION>Credit</SECTION>
                    <STATUS>P</STATUS>
                </EXTENDEDSTATUS>
                <EXTENDEDSTATUS>
                    <SECTION>Federal</SECTION>
                    <STATUS>P</STATUS>
                </EXTENDEDSTATUS>
                <EXTENDEDSTATUS>
                    <SECTION>PDB</SECTION>
                    <STATUS>P</STATUS>
                </EXTENDEDSTATUS>
            </EXTENDEDSTATUSES>
        </RESPONSE>
    </RESPONSES>
</IBR>
```

---

## Common Validation Rules

### Date Formats
- **DOB**: MMDDYYYY (e.g., 04011999 for April 1, 1999)
- **START_DATE/END_DATE**: MMYYYY (e.g., 042009 for April 2009)
- **TIMESTAMP**: MM/DD/YYYY HH:MM:SS format

### Status Codes
- **P**: Pass
- **F**: Fail  
- **R**: Review Required

### Valid Package Names
- Package 1
- Package 2  
- Credit

### State Codes
Use standard 2-letter state abbreviations. Invalid codes (like 'ZR') will cause validation errors.

---

## Integration Notes

1. **Batch Processing**: Submit multiple requests in a single batch using unique BATCHID
2. **Error Handling**: Check loader response for submission errors before polling for results
3. **Status Polling**: Use IBR_ID from loader response to check completion status
4. **Result Retrieval**: Parse extended statuses for detailed section-by-section results
5. **Authentication**: Use provided credentials for SOAP service authentication