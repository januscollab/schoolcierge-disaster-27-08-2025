import { ScrollView, Stack, Text } from 'tamagui'
import { Badge } from '../components/core/Badge'
import { Card } from '../components/core/Card'
import { Button } from '../components/core/Button'

export const BadgePlayground = () => {
  return (
    <ScrollView padding="$4">
      <Stack space="$4">
        {/* Section: Variants */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Variants
          </Text>

          <Stack flexDirection="row" space="$4" alignItems="center">
            <Badge variant="dot" />
            <Badge variant="number" value="3" />
            <Badge variant="text" value="New" />
          </Stack>
        </Stack>

        {/* Section: Colors */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Colors
          </Text>

          <Stack flexDirection="row" space="$4" alignItems="center">
            <Badge variant="dot" color="primary" />
            <Badge variant="dot" color="success" />
            <Badge variant="dot" color="warning" />
            <Badge variant="dot" color="error" />
            <Badge variant="dot" color="info" />
          </Stack>

          <Stack flexDirection="row" space="$4" alignItems="center">
            <Badge variant="number" value="1" color="primary" />
            <Badge variant="number" value="2" color="success" />
            <Badge variant="number" value="3" color="warning" />
            <Badge variant="number" value="4" color="error" />
            <Badge variant="number" value="5" color="info" />
          </Stack>

          <Stack flexDirection="row" space="$4" alignItems="center">
            <Badge variant="text" value="Primary" color="primary" />
            <Badge variant="text" value="Success" color="success" />
            <Badge variant="text" value="Warning" color="warning" />
            <Badge variant="text" value="Error" color="error" />
            <Badge variant="text" value="Info" color="info" />
          </Stack>
        </Stack>

        {/* Section: Sizes */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Sizes
          </Text>

          <Stack flexDirection="row" space="$4" alignItems="center">
            <Badge variant="dot" size="small" />
            <Badge variant="dot" size="medium" />
          </Stack>

          <Stack flexDirection="row" space="$4" alignItems="center">
            <Badge variant="number" value="3" size="small" />
            <Badge variant="number" value="3" size="medium" />
          </Stack>
        </Stack>

        {/* Section: Positions */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Positions
          </Text>

          <Stack flexDirection="row" space="$4">
            <Stack>
              <Card width={100} height={100} alignItems="center" justifyContent="center">
                <Badge variant="dot" position="top-right" />
                <Text>Top Right</Text>
              </Card>
            </Stack>

            <Stack>
              <Card width={100} height={100} alignItems="center" justifyContent="center">
                <Badge variant="dot" position="top-left" />
                <Text>Top Left</Text>
              </Card>
            </Stack>

            <Stack>
              <Card width={100} height={100} alignItems="center" justifyContent="center">
                <Badge variant="dot" position="inline" />
                <Text>Inline</Text>
              </Card>
            </Stack>
          </Stack>
        </Stack>

        {/* Section: Common Use Cases */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Common Use Cases
          </Text>

          <Stack flexDirection="row" space="$4">
            <Button>
              Notifications
              <Badge
                variant="number"
                value="99+"
                color="error"
                position="top-right"
                size="small"
              />
            </Button>

            <Button variant="secondary">
              Messages
              <Badge
                variant="dot"
                color="primary"
                position="top-right"
                size="small"
              />
            </Button>
          </Stack>

          <Card>
            <Stack space="$2">
              <Text fontSize="$h3" fontWeight="600">
                Feature Status
                <Badge
                  variant="text"
                  value="Beta"
                  color="warning"
                  position="inline"
                  size="small"
                />
              </Text>
              <Text>Card content with inline badge</Text>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </ScrollView>
  )
}