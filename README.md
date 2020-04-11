# Jsonapi Orchestrator

Building better jsonapi-compliant code

[![BCH compliance](https://bettercodehub.com/edge/badge/MyJobGlasses/jsonapi-orchestrator?branch=master)](https://bettercodehub.com/)

[![Github Actions tests](https://github.com/MyJobGlasses/jsonapi-orchestrator/workflows/Node.js%20CI/badge.svg)](https://github.com/MyJobGlasses/jsonapi-orchestrator/workflows/)

# Why an orchestrator

Jsonapi Orchestrator aims to help you to deal with various stages of json:api based API interaction with fetch or redux-based libs and frameworks

Ever wanted to use...
- json:api communication with your APIs
- `fetch`ing json:api resources
- Dispatch redux actions from json:api requests and resource
- Create/update things in one request (Sidepost)
- Be more explicit about what you're doing (association/disassociation VS creation/deletion)

**Jsonapi Orchestrator is For You 🎁 🎉**

# Features & Compatibility oj Jsonapi Orchestrator

Our version Jsonapi Orchestrator is currently made to work with json:api 1.0 and node > 12

Apart from the basic Json:api specification, we aim to support interesting extensions (some of which are projected for json:api v1.1)

- ✅ [The Sideposting Draft](https://github.com/json-api/json-api/pull/1197)
- 🏗 Supporting `method` in PATCH to distinguish creation VS association
- 🏗 Support for temporary IDs or `lid`s (see https://github.com/json-api/json-api/pull/1244)
- 🏗 Support for easy caching of resources

# HOW TO

## Building json:api Requests

A json:api request can be categorized either as a READ request (GET request) or a WRITE request (POST/PATCH/PUT). At this point we're not sure how we want to perform DELETEs.

Building those requests can be difficult because of the format of filters, sorting, and includes, in addition to specifying the endpoint. In addition, if you ever want to handle caching of requests, you would need to be ablte to specify metadata such as data freshness to decide later if you actually want to fire the query or reuse existing data already fetched.

Our Jsonapi builders will let you store this metadata so it can be reused with cache managers.

Here are some examples of basic read and writes

### APIs

You can manage a list of multiple APIs easily

```javascript
// my-apis.js
import { API } from 'jsonapi-orchestrator';

const APIs = {
  EMPLOYEE_API_V1 = new API({
    name: 'Employee API v1',
    url: 'https://employee.example.com/api/v1',
  }),
  EMPLOYEE_API_V2 = new API({
    name: 'Employee API v2',
    url: process.env.EMPLOYEE_API_V1_URL,
  }),
  METRICS_API_V2 = new API({
    name: 'Metrics API v2',
    url: 'https://metrics.example.com/api/v2',
  }),
};

export default { METRICS_API_V2, EMPLOYEE_API_V1, EMPLOYEE_API_V2 }

// somewhere
import APIs from 'my-apis'
```

### Basic READ of single document

```javascript
import {
  JsonapiResourceReader,
  JsonapiRequestBuilder,
} from 'jsonapi-orchestrator/builders';

employeeReader = new JsonapiResourceReader({ type: 'employee'})
employeeReader.sideload({ company: { admins: true } })
employeeReader.filter({ in_vacation: false })
employeeReader.sort({ next_holiday_at: 'asc' })
employeeReader.page({ size: 10, number: 2 })

requestBuilder = new JsonapiRequestBuilder({
  resource: employeeReader,
  path: '/employee/profile/:id',
  params: { id: employeeId }
  api: APIs.EMPLOYEE_API_V1,
})

// Redux-saga
yield put(requestBuilder.asReduxAction())
// Fetch
return fetch(requestBuilder.compileUrl(), requestBuilder.fetchOptions());
```

### Basic POST of single document with sideposting

Let's POST / Create an employee profile linked to an existing user account

```javascript

// Assume you receive an `action` that tells you to update
// the "educations" of your employee profile, as well as his user name
// employee.educations && employee.user
//
// Assume your have an endpoint to json:api patch the employee
// with the sideposting draft

// This is a regular update of the main resource
employeeWriter = new JsonapiResourceWriter({
  type: 'employee/profile'
  attributes: action.employeeProfile.attributes
});
// Note, since we did not provide any ID the HttpMethod is inferred to be POST
// Had we provided ({ type: 'employee/profile', id: 'cafebabe' }) it would be inferred to be a PATCH

// Next, update the employee.user data via sideposting
userBuilder = new JsonapiResourceWriter({
  type: 'user',
  id: 'cafebabe',
  attributes: action.user.attributes
});
employeeWriter.sidepost({
  relationship: 'user',
  method: 'update', // other methods include create/associate/disassociate, refer to the sideposting draft
  resource: userBuilder
}):

// Next, update the employee.educations data via sideposting
educationBuilders = action.educations.forEach((e) => {
  educationWriter = new JsonapiResourceWriter({
    type: 'education',
    attributes: e.attributes
  });
  // e.method should return 'create' 'update' or 'destroy' or 'disassociate'
  employeeWriter.sidepost({
    relationship: 'educations',
    method: e.method,
    educationWriter
  )};
});

// Finally assemble the request and select the API to use
requestBuilder = new JsonapiRequestBuilder({
  resource: employeeWriter,
  method: 'POST',
  api: APIs.EMPLOYEE_API_V1,
})
requestBuilder.path = '/employee/profile'
requestBuilder.addMeta({ invitation_token: invitation_token }) // SHould merge with existing metas

// Redux-saga
yield put(requestBuilder.asReduxAction())
// fetch
return fetch(requestBuilder.compileUrl(), requestBuilder.fetchOptions());
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

# HOWTO release a new version

Just run `yarn release` and pick an appropriate version number !

This will export the `src/` folder into a `dist/` folder and make a npm package from this.

(The root `index.js` is just a hack to make dev's life easier mouhahahaha)
