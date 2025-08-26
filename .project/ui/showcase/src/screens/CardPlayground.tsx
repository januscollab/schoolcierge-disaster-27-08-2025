import { ScrollView, Stack, Text } from 'tamagui'
import { Card } from '../components/core/Card'

export const CardPlayground = () => {
  return (
    <ScrollView padding="$4">
      <Stack space="$4">
        {/* Section: Variants */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Variants
          </Text>

          <Card variant="default">
            <Text>Default Card</Text>
          </Card>

          <Card variant="priority" priority="critical">
            <Text>Critical Priority Card</Text>
          </Card>

          <Card variant="priority" priority="urgent">
            <Text>Urgent Priority Card</Text>
          </Card>

          <Card variant="priority" priority="achievement">
            <Text>Achievement Priority Card</Text>
          </Card>

          <Card variant="interactive" onPress={() => {}}>
            <Text>Interactive Card (Press Me)</Text>
          </Card>
        </Stack>

        {/* Section: Elevation */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Elevation
          </Text>

          <Card elevation="none">
            <Text>No Elevation</Text>
          </Card>

          <Card elevation="small">
            <Text>Small Elevation</Text>
          </Card>

          <Card elevation="medium">
            <Text>Medium Elevation</Text>
          </Card>

          <Card elevation="large">
            <Text>Large Elevation</Text>
          </Card>
        </Stack>

        {/* Section: Content Examples */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Content Examples
          </Text>

          <Card>
            <Stack space="$2">
              <Text fontSize="$h3" fontWeight="600">
                Card Title
              </Text>
              <Text fontSize="$body" color="$neutral.darkGray">
                This is a card with multiple lines of content to demonstrate how text
                wraps and spacing works within cards.
              </Text>
            </Stack>
          </Card>

          <Card>
            <Stack space="$2">
              <Text fontSize="$h3" fontWeight="600">
                Media Card
              </Text>
              <Stack
                height={200}
                backgroundColor="$neutral.lightGray"
                borderRadius="$medium"
                alignItems="center"
                justifyContent="center"
              >
                <Text>Image Placeholder</Text>
              </Stack>
              <Text fontSize="$bodySmall" color="$neutral.gray">
                Caption text
              </Text>
            </Stack>
          </Card>
        </Stack>

        {/* Section: Nested Cards */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Nested Cards
          </Text>

          <Card>
            <Stack space="$2">
              <Text fontSize="$h3" fontWeight="600">
                Parent Card
              </Text>
              <Card variant="priority" priority="info">
                <Text>Child Card 1</Text>
              </Card>
              <Card variant="priority" priority="warning">
                <Text>Child Card 2</Text>
              </Card>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </ScrollView>
  )
}