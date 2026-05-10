package org.slitherlinkgame.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
            title = "slitherlink",
            version = "v1",
            description = "Backend implementation for game Slitherlink"
    )
)
public class SwaggerConfig {
}
