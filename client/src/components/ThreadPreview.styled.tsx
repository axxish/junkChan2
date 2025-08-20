// src/components/ThreadPreview.styled.ts
import styled from 'styled-components';

// 1. Replaces the main <div> container
export const ThreadContainer = styled.div`
  /* Add any container-specific styles here if needed */
`;

// 2. Replaces <Stack>
export const VerticalStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}; // Default gap, can be overridden
`;

// 3. Replaces <Flex> and <Group>
export const HorizontalGroup = styled.div<{ gap?: 'sm' | 'md' | 'lg' }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme, gap = 'md' }) => theme.spacing[gap]};
`;

// 4. Replaces <Text>
export const StyledText = styled.p`
  margin: 0; // Reset default paragraph margin
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
`;

// 5. Replaces <Text> used for the username
export const Username = styled(StyledText)`
  font-weight: bold;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

// 6. Replaces <Image>
export const PostImage = styled.img`
  max-width: 200px;
  height: auto; // Maintain aspect ratio
  display: block; // Removes bottom space under the image
`;

// 7. Replaces <Divider>
export const StyledDivider = styled.hr`
  border: 0;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;