package com.devclass.backend.controller;

import com.devclass.backend.service.VideoStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoStorageService videoStorageService;

    @GetMapping("/{filename:.+}")
    public ResponseEntity<ResourceRegion> serve(
            @PathVariable String filename,
            @RequestHeader HttpHeaders headers
    ) throws IOException {
        Path file = videoStorageService.load(filename);
        Resource resource = new UrlResource(file.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        long contentLength = resource.contentLength();
        List<HttpRange> ranges = headers.getRange();

        ResourceRegion region;
        HttpStatus status;

        if (ranges.isEmpty()) {
            region = new ResourceRegion(resource, 0, contentLength);
            status = HttpStatus.OK;
        } else {
            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long length = Math.min(2 * 1024 * 1024L, end - start + 1);
            region = new ResourceRegion(resource, start, length);
            status = HttpStatus.PARTIAL_CONTENT;
        }

        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.status(status)
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .body(region);
    }
}
