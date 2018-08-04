# Jsonapi Orchestrator

Building better jsonapi-compliant code

[![BCH compliance](https://bettercodehub.com/edge/badge/MyJobGlasses/jsonapi-orchestrator?branch=master)](https://bettercodehub.com/)

[![CircleCI](https://circleci.com/gh/MyJobGlasses/jsonapi-orchestrator.svg?style=svg)](https://circleci.com/gh/MyJobGlasses/jsonapi-orchestrator)

# What is it ?

Ever wanted to use...
- json:api communication with your APIs
- Redux based storage of resources retrieved from the API
- Side effects with redux-saga posting to your APIs
- Caching expensive requests to alleviate load on your APIs

**Jsonapi Orchestrator is For You 🎁 🎉**

# HOW TO

Jsonapi Orchestrator helps you to deal with various stages of json:api based API interaction

## Building json:api Requests

A json:api request can be categorized either as a READ request (GET request) or a WRITE request (POST/PATCH/PUT).

Building those requests can be difficult because of the format of filters, sorting, and includes, in addition to specifying the endpoint. In addition, if you ever want to handle caching of requests, you would need to be ablte to specify metadata such as data freshness to decide later if you actually want to fire the query or reuse existing data already fetched.

Our Jsonapi builders will let you store this metadata so it can be reused with cache managers.

Here are some examples of basic read and writes

### Basic READ of single document

```javascript
employeeReader = new JsonapiResourceReader({ type: 'employee'})
employeeReader.sideload({ company: { admins: true } })
employeeReader.filter({ in_vacation: false })
employeeReader.sort({ next_holiday_at: 'asc' })

requestBuilder = new JsonapiRequestBuilder({
  resource: employeeReader,
  method: 'GET',
  path: '/employee/profile/:id',
  params: { id: employeeId }
  collection: false,
  api: APIs.HERMES,
})

yield put(requestBuilder.action())
```

### Basic POST of single document with sideposting

```javascript
employeeWriter = new JsonapiResourceWriter({ type: 'employee/profile' })
resourceBuilder.setAttributes(...action.attributes)

// Sidepost the user
userBuilder = new JsonapiResourceWriter({
  type: 'user',
  id: 'cafebabe',
  attributes: currentUser.attributes
})
employeeWriter.sidepost({
  relationship: 'user', method: 'update', userBuilder
)

// Sidepost educations
educationBuilders = action.educations.forEach( (e) => {
  educationWriter = new JsonapiResourceWriter({ type: 'education', attributes: e.attributes })
  // e.method should return 'create' 'update' or 'destroy' or 'disassociate'
  employeeWriter.sidepost({ relationship: 'educations', method: e.method, educationWriter)
})

requestBuilder = new JsonapiRequestBuilder({
  builder: employeeWriter,
  method: 'POST',
  api: process.env.HERMES_API_URL,
  attributes: existingEmployee.attributes
})
requestBuilder.endpointPath = '/employee/profile'
requestBuilder.addMeta({ invitation_token: invitation_token }) // SHould merge with existing metas

yield put(requestBuilder.action)
```

You can find more advanced examples, including redux-saga based examples, [in the /examples folder](./examples/)

## Feeding the json:api responses to your Redux state

TODO by Dimitri

## Handle caching of requests

For a later version of JO

# Credits

- Dimitri DOMEY (Grand Bidou) @DOMEYD
- Cyril Duchon-Doris (Nickname-yet-to-be-found) @Startouf

# Contribute

Well, please
- Open an Issue describing your feature/bug/whatever addition you want to make,
- If you feel 💪 enough, open a PR with some commits and reference your issue number inside. If you're also using ZenHub (💕) you can attach your PR to your issue !
