import {
  JsonapiRequestBuilder, // Request wrapper
  JsonapiResourceReader, // Single READ (show)
  JsonapiResourceListReader, // List READ (index)
  JsonapiResourceWriter // Single WRITE (post/patch)
} from '../src/requests/builders'

import { timeOut } from '../utils'

import { APIs } from '../config/' // APIs = { HERMES: { url: https://www.example.com/api/v1/, prefix: 'HERMES' }}

/*
 * Read single + sideload example
 */

function * initEmployeePageView() {
  employeeReader = new JsonapiResourceReader({ type: 'employee/profile' })

  // Data expiration / caching
  employeeReader.dataMustBeFresh() // If we want to force a request
  employeeReader.dataCanBeOld() // If we want to allow skipping the request if there is some cached version already
  employeeReader.dataMustBeFresherThan(moment().startOf('day')) // If we want to ensure data is fresher than

  // Sideloading
  employeeReader.sideload({ user: true }).dataMustBeFresh() // ?include=user
  employeeReader.sideload({ educations: { school: true } }).dataMustBeFresherThan(durations.hours(2).ago) // include=educations.school

  // Sorting
  employeeReader.sort({ educations: { school: { name: 'asc'} } })  // ?sort=educations.school.name
  employeeReader.sort([{ positive_like_count: 'desc'}, { company_name: 'asc'} ])  // ?sort=-positive_like_count,company_name

  // Filtering
  employeeReader.filter({ company_name: ['air_france', 'axa'] }) // ?filter[company_name]=air_france,axa
  employeeReader.filter({ tags: { name: ['it_digital']}, type: ['mentor']) // ?filter[tags][name]=it%2Cdigital&filter[type]=mentor

  requestBuilder = new JsonapiRequestBuilder({
    resource: employeeReader,
    method: 'GET',
    path: '/employee/profile/:id',
    params: { id: employeeId } // Should be smart substituted
    api: APIs.EMPLOYEE_API // Helps set the base URL
  })

  yield put(requestBuilder.asReduxAction())
  return yield race({
    success: take(READ_EMPLOYEE_RESOURCE_SUCCESS),
    error: take(READ_EMPLOYEE_RESOURCE_ERROR),
    timeout: call(timeOut)
  })
}

/*
 * Read List + sideload example
 */

function * initConversationsPageView() {
  conversationsReader = new JsonapiResourceListReader({ type: 'messaging/conversation' })

  /* Data expiration
   * On READ Lists, it should generate an index whose ID is a hash of
   * - filters
   * - sortings
   * - URL params
   * And use expiration scoped to this ID
   */
  conversationsReader.dataCanBeOld()

  // Sideloading
  conversationsReader.sideload({ initiator: true, initiator_profile: { active_school: true } }) // .dataCanBeOld()
  conversationsReader.sideload({ recipient: true, recipient_profile: { company: true } })
  conversationsReader.sideload({ appointments: true })

  // Filtering
  conversationsReader.filter({ cancelled: [false] }) // ?filter[cancelled]=false

  // Sorting
  conversationsReader.sort({ last_message_at: 'desc' }) // ?sort=last_message_at

  requestBuilder = new JsonapiRequestBuilder({
    resource: conversationsReader,
    method: 'GET',
    path: '/conversations',
    api: APIs.CONVERSATIONS_API_V1
  })

  yield put(requestBuilder.asReduxAction())
  return yield race({
    success: take(READ_CONVERSATION_RESOURCE_LIST_SUCCESS),
    error: take(READ_CONVERSATION_RESOURCE_LIST_ERROR),
    timeout: call(timeOut)
  })
}


/*
 * Write single + sidepost example from a saga
 */

function* watchProfessionalCreateSaga(action) {
  yield takeEvery(requestActionTypes, createProfessional);@
}

function* createProfessional(action) {
  const currentUser = yield select(currentUserSelector)

  // Build the resource from the action / form
  employeeWriter = new JsonapiResourceWriter({ type: 'employee/profile' })
  resourceBuilder.setAttributes(...asReduxAction.attributes)

  // Sidepost the user
  userBuilder = new JsonapiResourceWriter({ type: 'user', id: '', attributes: currentUser.attributes })
  employeeWriter.sidepost({ relationship: 'user', method: 'update', userBuilder) // Should set relationship one-way

  // Sidepost educations
  educationBuilders = action.educations.forEach( (e) => {
    educationWriter = new JsonapiResourceWriter({ type: 'education', attributes: e.attributes })
    // e.method should return 'create' 'update' or 'destroy' or 'disassociate'
    employeeWriter.sidepost({ relationship: 'educations', method: e.method, educationWriter)
  })

  requestBuilder = new JsonapiRequestBuilder({
    builder: employeeWriter,
    method: 'POST',
    api: APIs.EMPLOYEE_API,
    attributes: existingEmployee.attributes
  })
  requestBuilder.endpointPath = '/employee/profile'
  requestBuilder.addMeta({ invitation_token: invitation_token }) // SHould merge with existing metas

  yield put(requestBuilder.asReduxAction())
  return yield race({
    success: take(WRITE_EMPLOYEE_RESOURCE_SUCCESS),
    error: take(WRITE_EMPLOYEE_RESOURCE_ERROR),
    timeout: call(timeOut)
  })
}
