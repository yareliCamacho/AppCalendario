import { ActivityIndicator, Modal, View, StyleSheet } from 'react-native';
import { colors } from '../../config/theme';

export function LoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <Modal transparent visible={visible}>
      <View style={styles.backdrop}>
        <ActivityIndicator size="large" color={colors.primaryPinkDark} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
