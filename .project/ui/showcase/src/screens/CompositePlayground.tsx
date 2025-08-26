import { ScrollView, Stack, Text } from 'tamagui'
import { PriorityMessageCard } from '../components/composite/PriorityMessageCard'
import { StudentSwitcher } from '../components/composite/StudentSwitcher'

export const CompositePlayground = () => {
  return (
    <ScrollView padding="$4">
      <Stack space="$6">
        {/* Section: Priority Message Cards */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Priority Message Cards
          </Text>

          <PriorityMessageCard
            priority="critical"
            from="Jane Smith"
            fromRole="nurse"
            subject="Urgent: Medical Update"
            preview="Your child has reported not feeling well during PE class. Please contact the nurse's office as soon as possible to discuss their condition."
            timestamp={new Date()}
            unread={true}
            requiresAction={true}
            studentName="Emma Smith"
            onPress={() => {}}
            onActionPress={() => {}}
          />

          <PriorityMessageCard
            priority="urgent"
            from="John Doe"
            fromRole="teacher"
            subject="Assignment Due Tomorrow"
            preview="The math homework is due tomorrow afternoon. This assignment counts for 20% of the final grade."
            timestamp={new Date()}
            unread={true}
            requiresAction={false}
            studentName="Liam Smith"
            onPress={() => {}}
          />

          <PriorityMessageCard
            priority="achievement"
            from="Principal Wilson"
            fromRole="principal"
            subject="Academic Achievement!"
            preview="Congratulations! Your child has been selected for the Honor Roll this semester based on their outstanding academic performance."
            timestamp={new Date()}
            unread={false}
            requiresAction={false}
            studentName="Noah Smith"
            onPress={() => {}}
          />

          <PriorityMessageCard
            priority="academic"
            from="Ms. Johnson"
            fromRole="teacher"
            subject="Project Update"
            preview="The science fair project is progressing well. Here's some feedback on the latest draft submission."
            timestamp={new Date()}
            unread={false}
            requiresAction={false}
            studentName="Emma Smith"
            onPress={() => {}}
          />

          <PriorityMessageCard
            priority="info"
            from="School Admin"
            fromRole="admin"
            subject="School Calendar Update"
            preview="Please note the following changes to the upcoming school events and holiday schedule."
            timestamp={new Date()}
            unread={false}
            requiresAction={false}
            onPress={() => {}}
          />
        </Stack>

        {/* Section: Student Switcher */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Student Switcher
          </Text>

          <Text fontSize="$h3" fontWeight="600" marginBottom="$2">
            Two Students
          </Text>
          <StudentSwitcher
            students={[
              { id: '1', name: 'Emma Smith', grade: '3' },
              { id: '2', name: 'Liam Smith', grade: '5' },
            ]}
            selectedId="1"
            onSelect={() => {}}
          />

          <Text fontSize="$h3" fontWeight="600" marginTop="$4" marginBottom="$2">
            Three Students
          </Text>
          <StudentSwitcher
            students={[
              { id: '1', name: 'Emma Smith', grade: '3' },
              { id: '2', name: 'Liam Smith', grade: '5' },
              { id: '3', name: 'Noah Smith', grade: '8' },
            ]}
            selectedId="2"
            onSelect={() => {}}
          />

          <Text fontSize="$h3" fontWeight="600" marginTop="$4" marginBottom="$2">
            Four Students
          </Text>
          <StudentSwitcher
            students={[
              { id: '1', name: 'Emma Smith', grade: '3' },
              { id: '2', name: 'Liam Smith', grade: '5' },
              { id: '3', name: 'Noah Smith', grade: '8' },
              { id: '4', name: 'Olivia Smith', grade: '10' },
            ]}
            selectedId="3"
            onSelect={() => {}}
          />
        </Stack>
      </Stack>
    </ScrollView>
  )
}