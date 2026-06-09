package com.smartlock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableCaching
@ConfigurationPropertiesScan
public class SmartLockApplication {

    private static final Logger log = LoggerFactory.getLogger(SmartLockApplication.class);

    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(SmartLockApplication.class, args);
        String[] profiles = ctx.getEnvironment().getActiveProfiles();
        log.info("Propvian started — profiles: {} | logs persisted to /app/logs/", (Object) profiles);
    }
}
