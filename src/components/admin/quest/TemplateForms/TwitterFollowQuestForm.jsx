import Enums from 'enums'
import React from 'react'
import { Formik } from 'formik'
import { object, string, number } from 'yup'
import { GridItem, useToast } from '@chakra-ui/react'
import { useAdminQuestUpsert } from '@hooks/admin/quest'
import { AdminQuestFormWrapper } from '../AddQuest'
import moment from 'moment'
import { NonRequiredTextInput, RequiredInput } from '@components/shared/Formik'
import { QuestStyle, QuestDuration } from '@prisma/client'

const TwitterFollowQuestSchema = object().shape({
  text: string().required('Quest text is required'),
  description: string().required('Quest description is required'),
  completedText: string().required('Complete Text is required'),
  quantity: number().required().min(1),
  image: string().test(
    'valid image',
    'Image is required when quest style is Featured!',
    function () {
      if (this.parent.style === QuestStyle.NORMAL) return true
      const { image } = this.parent
      if (this.parent.style === QuestStyle.FEATURED && (!image || this.parent.image.length < 10)) {
        return false
      }
      return true
    },
  ),
  extendedQuestData: object().shape({
    followAccount: string().required('A Twitter account is required!'),
    startDate: string().test('valid startDate', 'Start Date is not valid!', function () {
      const { from } = this
      const { startDate } = from[0].value // first ancestor
      const { duration } = from[1].value // root ancestor

      if (duration === QuestDuration.ONGOING) return true

      if (duration === QuestDuration.LIMITED && !startDate) {
        return false
      }

      return true
    }),
    endDate: string().test('valid endDate', 'End Date is not valid!', function () {
      try {
        const { from } = this
        const { startDate, endDate } = from[0].value
        const { duration } = from[1].value
        if (duration === QuestDuration.ONGOING) return true

        if (duration === QuestDuration.LIMITED && !endDate) {
          return false
        }

        if (duration === QuestDuration.LIMITED && startDate > endDate) {
          return false
        }
        return true
      } catch (error) {
        console.log(error)
      }
    }),
  }),
})

const TwitterFollowQuestForm = ({ quest = null, isCreate = true }) => {
  const initialValues = {
    type: Enums.FOLLOW_TWITTER,
    extendedQuestData: quest?.extendedQuestData ?? {
      followAccount: '',
      collaboration: '',
      startDate: moment.utc(new Date()),
      endDate: moment.utc(new Date()),
    },
    text: quest?.text || 'Follow Twitter Account',
    description: quest?.description ?? 'Require the user to follow a Twitter Account',
    completedText: quest?.completedText || 'Completed',
    rewardTypeId: quest?.rewardTypeId || 1,
    quantity: quest?.quantity || 0,
    isEnabled: quest?.isEnabled ?? true,
    isRequired: quest?.isRequired ?? false,
    id: quest?.id || 0,
    style: quest?.style || QuestStyle.NORMAL,
    image: quest?.image || '',
    duration: quest?.duration || QuestDuration.ONGOING,
  }

  const { isLoading, mutateAsync } = useAdminQuestUpsert()
  const toast = useToast()

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={TwitterFollowQuestSchema}
      validateOnBlur={true}
      validateOnChange={true}
      onSubmit={async (fields, { setStatus }) => {
        try {
          alert('SUCCESS!! :-)\n\n' + JSON.stringify(fields, null, 4))
          let res = await mutateAsync(fields)
          if (res?.isError) {
            setStatus(res.message)
          } else {
            console.log(res)
            toast({
              title: 'Success',
              description: `Mutate quest success`,
              position: 'bottom-right',
              status: 'success',
              duration: 2000,
            })
          }
        } catch (error) {
          setStatus(error.message)
        }
      }}
    >
      {({ values, errors, status, touched, handleChange, setFieldValue, dirty }) => {
        const childrenProps = {
          isCreate,
          isLoading,
          status,
          values,
          errors,
          touched,
          dirty,
          setFieldValue,
        }
        return (
          <AdminQuestFormWrapper {...childrenProps}>
            <GridItem colSpan={2}>
              <RequiredInput
                label={'Twitter Account (whale.drop)'}
                fieldName="extendedQuestData.followAccount"
                error={errors?.extendedQuestData?.followAccount}
                touched={touched?.extendedQuestData?.followAccount}
              />
            </GridItem>
            <GridItem colSpan={2}>
              <NonRequiredTextInput
                label={'Collaboration (leaving blank for non specific collaboration)'}
                fieldName="extendedQuestData.collaboration"
              />
            </GridItem>
          </AdminQuestFormWrapper>
        )
      }}
    </Formik>
  )
}

export default TwitterFollowQuestForm
