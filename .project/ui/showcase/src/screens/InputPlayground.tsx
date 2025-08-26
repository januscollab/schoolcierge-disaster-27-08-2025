import { ScrollView, Stack, Text } from 'tamagui'
import { Input } from '../components/core/Input'
import { Search, Mail, Lock, Eye, EyeOff } from '@tamagui/lucide-icons'

export const InputPlayground = () => {
  return (
    <ScrollView padding="$4">
      <Stack space="$4">
        {/* Section: Basic */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Basic Inputs
          </Text>

          <Input
            placeholder="Text input"
          />

          <Input
            label="With Label"
            placeholder="Enter text"
          />

          <Input
            label="With Helper"
            placeholder="Enter text"
            helperText="This is helper text"
          />
        </Stack>

        {/* Section: Types */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Input Types
          </Text>

          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
          />

          <Input
            type="password"
            label="Password"
            placeholder="Enter password"
          />

          <Input
            type="number"
            label="Number"
            placeholder="Enter number"
          />

          <Input
            type="search"
            label="Search"
            placeholder="Search..."
          />
        </Stack>

        {/* Section: States */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            States
          </Text>

          <Input
            label="Default"
            placeholder="Default state"
          />

          <Input
            label="Focused"
            placeholder="Focused state"
            state="focused"
          />

          <Input
            label="Error"
            placeholder="Error state"
            state="error"
            error="This field has an error"
          />

          <Input
            label="Success"
            placeholder="Success state"
            state="success"
          />

          <Input
            label="Warning"
            placeholder="Warning state"
            state="warning"
          />

          <Input
            label="Disabled"
            placeholder="Disabled state"
            disabled
          />
        </Stack>

        {/* Section: With Icons */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            With Icons
          </Text>

          <Input
            label="Left Icon"
            placeholder="Search..."
            leftIcon={<Search size={20} color="$neutral.gray" />}
          />

          <Input
            label="Right Icon"
            placeholder="Enter email"
            rightIcon={<Mail size={20} color="$neutral.gray" />}
          />

          <Input
            type="password"
            label="Both Icons"
            placeholder="Enter password"
            leftIcon={<Lock size={20} color="$neutral.gray" />}
            rightIcon={<Eye size={20} color="$neutral.gray" />}
            onRightIconPress={() => {}}
          />
        </Stack>

        {/* Section: Multiline */}
        <Stack space="$2">
          <Text fontSize="$h2" fontWeight="600" marginBottom="$2">
            Multiline
          </Text>

          <Input
            label="Multiline Input"
            placeholder="Enter multiple lines of text..."
            multiline
            numberOfLines={4}
          />

          <Input
            label="With Character Limit"
            placeholder="Limited to 100 characters..."
            multiline
            numberOfLines={3}
            maxLength={100}
            helperText="0/100 characters"
          />
        </Stack>
      </Stack>
    </ScrollView>
  )
}