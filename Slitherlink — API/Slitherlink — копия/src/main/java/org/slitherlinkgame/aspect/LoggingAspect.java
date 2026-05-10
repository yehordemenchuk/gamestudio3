package org.slitherlinkgame.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    private Object checkJoinPoint(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            return joinPoint.proceed();
        } catch (Throwable e) {
            log.error("Error in method {}: {}", joinPoint.getSignature().getName(), e.getMessage());
            throw e;
        }
    }

    @Pointcut("execution(* org.slitherlinkgame.service.*.*(..))")
    public void serviceMethods() {
    }

    @Around("serviceMethods()")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();

        log.info("started method: {}.{}() with args: {}",
                joinPoint.getSignature().getDeclaringTypeName(),
                joinPoint.getSignature().getName(),
                Arrays.toString(joinPoint.getArgs()));

        Object result = checkJoinPoint(joinPoint);

        long executionTime = System.currentTimeMillis() - start;


        log.info("finished method : {} in {} ms", joinPoint.getSignature().getName(), executionTime);

        return result;
    }
}

