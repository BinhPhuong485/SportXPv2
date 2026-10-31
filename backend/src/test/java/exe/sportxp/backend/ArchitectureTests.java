package exe.sportxp.backend;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ArchitectureTests {

    @Test
    void verifyModularStructure() {
        // Tự động quét và phát hiện vi phạm ranh giới kiến trúc giữa các module
        ApplicationModules.of(BackendApplication.class).verify();
    }
}

