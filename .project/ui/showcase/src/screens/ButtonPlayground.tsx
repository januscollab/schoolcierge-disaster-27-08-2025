import { ScrollView, Stack, Text } from 'tamagui'
import { Button } from '../components/core/Button'

export const ButtonPlayground = () => {
  return (
    <ScrollView padding="$4">
      <Stack space="$4">
        {/* Section: Variants */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Variants
          </Text>

          <Button variant="primary">
            Primary Button
          </Button>

          <Button variant="secondary">
            Secondary Button
          </Button>

          <Button variant="text">
            Text Button
          </Button>

          <Button variant="danger">
            Danger Button
          </Button>
        </Stack>

        {/* Section: Sizes */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Sizes
          </Text>

          <Button size="small">
            Small Button
          </Button>

          <Button size="medium">
            Medium Button
          </Button>

          <Button size="large">
            Large Button
          </Button>
        </Stack>

        {/* Section: States */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            States
          </Text>

          <Button>
            Default
          </Button>

          <Button disabled>
            Disabled
          </Button>

          <Button loading>
            Loading...
          </Button>
        </Stack>

        {/* Section: Icons */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            With Icons
          </Text>

          <Button icon="plus">
            Icon Left
          </Button>

          <Button icon="plus" iconPosition="right">
            Icon Right
          </Button>
        </Stack>

        {/* Section: Width */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Width
          </Text>

          <Button>
            Default Width
          </Button>

          <Button fullWidth>
            Full Width
          </Button>
        </Stack>
      </Stack>
    </ScrollView>
  )
}