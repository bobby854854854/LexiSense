"""
LexiSense Workflow, Audit, and Notifications API Tests
Tests for: Workflow transitions, Audit logging, Notifications, RBAC
"""
import pytest
import requests
import os
import io
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://docflow-analyzer.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "testuser@lexisense.com"
TEST_PASSWORD = "Test1234!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def test_contract_id(auth_headers):
    """Create a test contract for workflow testing - starts as 'draft'"""
    file_content = b"This is a test contract for workflow testing. It contains terms and conditions for a service agreement between Party A and Party B. The effective date is January 1, 2025 and expires on December 31, 2025."
    
    files = {
        'file': ('workflow_test_contract.txt', io.BytesIO(file_content), 'text/plain')
    }
    data = {
        'title': f'TEST_Workflow_Contract_{uuid.uuid4().hex[:8]}',
        'counterparty': 'Workflow Test Corp',
        'contractType': 'Service Agreement'
    }
    
    response = requests.post(
        f"{BASE_URL}/api/contracts",
        headers=auth_headers,
        files=files,
        data=data
    )
    
    if response.status_code == 200:
        contract_id = response.json()["id"]
        print(f"✓ Created test contract: {contract_id}")
        yield contract_id
        
        # Cleanup: delete the test contract
        requests.delete(
            f"{BASE_URL}/api/contracts/{contract_id}",
            headers=auth_headers
        )
        print(f"✓ Cleaned up test contract: {contract_id}")
    else:
        pytest.skip(f"Failed to create test contract: {response.text}")


class TestWorkflowStates:
    """Workflow states endpoint tests"""
    
    def test_get_workflow_states(self, auth_headers):
        """Test GET /api/contracts/workflow/states returns valid states"""
        response = requests.get(
            f"{BASE_URL}/api/contracts/workflow/states",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "states" in data
        assert "labels" in data
        assert "transitions" in data
        
        # Verify expected states
        expected_states = ["draft", "review", "approved", "active", "expired"]
        for state in expected_states:
            assert state in data["states"], f"Missing state: {state}"
        
        # Verify transitions
        assert "draft" in data["transitions"]
        assert "review" in data["transitions"]["draft"]
        
        print(f"✓ Workflow states: {data['states']}")


class TestWorkflowTransitions:
    """Workflow transition tests - full workflow cycle"""
    
    def test_new_contract_starts_as_draft(self, auth_headers, test_contract_id):
        """Test that newly uploaded contracts start with 'draft' status"""
        response = requests.get(
            f"{BASE_URL}/api/contracts/{test_contract_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "draft", f"Expected 'draft', got '{data['status']}'"
        print(f"✓ New contract starts as 'draft': {test_contract_id}")
    
    def test_submit_for_review_transition(self, auth_headers, test_contract_id):
        """Test POST /api/contracts/:id/workflow/submit_for_review transitions draft->review"""
        response = requests.post(
            f"{BASE_URL}/api/contracts/{test_contract_id}/workflow/submit_for_review",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "review"
        assert data["previousStatus"] == "draft"
        assert "message" in data
        
        # Verify contract status changed
        contract_response = requests.get(
            f"{BASE_URL}/api/contracts/{test_contract_id}",
            headers=auth_headers
        )
        assert contract_response.json()["status"] == "review"
        
        print(f"✓ Transition draft->review successful")
    
    def test_approve_transition(self, auth_headers, test_contract_id):
        """Test POST /api/contracts/:id/workflow/approve transitions review->approved"""
        response = requests.post(
            f"{BASE_URL}/api/contracts/{test_contract_id}/workflow/approve",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "approved"
        assert data["previousStatus"] == "review"
        
        # Verify contract status changed
        contract_response = requests.get(
            f"{BASE_URL}/api/contracts/{test_contract_id}",
            headers=auth_headers
        )
        assert contract_response.json()["status"] == "approved"
        
        print(f"✓ Transition review->approved successful")
    
    def test_activate_transition(self, auth_headers, test_contract_id):
        """Test POST /api/contracts/:id/workflow/activate transitions approved->active"""
        response = requests.post(
            f"{BASE_URL}/api/contracts/{test_contract_id}/workflow/activate",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "active"
        assert data["previousStatus"] == "approved"
        
        # Verify contract status changed
        contract_response = requests.get(
            f"{BASE_URL}/api/contracts/{test_contract_id}",
            headers=auth_headers
        )
        assert contract_response.json()["status"] == "active"
        
        print(f"✓ Transition approved->active successful")
    
    def test_get_workflow_history(self, auth_headers, test_contract_id):
        """Test GET /api/contracts/:id/workflow/history returns full history"""
        response = requests.get(
            f"{BASE_URL}/api/contracts/{test_contract_id}/workflow/history",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "currentStatus" in data
        assert "history" in data
        assert "transitions" in data
        assert "labels" in data
        
        # Should have 3 history entries (submit, approve, activate)
        assert len(data["history"]) >= 3, f"Expected at least 3 history entries, got {len(data['history'])}"
        
        # Verify history entry structure
        for entry in data["history"]:
            assert "fromStatus" in entry
            assert "toStatus" in entry
            assert "action" in entry
            assert "userId" in entry
            assert "timestamp" in entry
        
        print(f"✓ Workflow history: {len(data['history'])} entries")


class TestWorkflowReject:
    """Test workflow rejection flow"""
    
    def test_reject_transition(self, auth_headers):
        """Test POST /api/contracts/:id/workflow/reject transitions review->draft"""
        # Create a new contract for rejection test
        file_content = b"Test contract for rejection workflow."
        files = {
            'file': ('reject_test.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {
            'title': f'TEST_Reject_Contract_{uuid.uuid4().hex[:8]}',
            'counterparty': 'Reject Test Corp',
            'contractType': 'General'
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers,
            files=files,
            data=data
        )
        assert create_response.status_code == 200
        contract_id = create_response.json()["id"]
        
        try:
            # Submit for review first
            submit_response = requests.post(
                f"{BASE_URL}/api/contracts/{contract_id}/workflow/submit_for_review",
                headers=auth_headers
            )
            assert submit_response.status_code == 200
            
            # Now reject
            reject_response = requests.post(
                f"{BASE_URL}/api/contracts/{contract_id}/workflow/reject",
                headers=auth_headers
            )
            assert reject_response.status_code == 200
            reject_data = reject_response.json()
            
            assert reject_data["status"] == "draft"
            assert reject_data["previousStatus"] == "review"
            
            print(f"✓ Transition review->draft (reject) successful")
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/contracts/{contract_id}",
                headers=auth_headers
            )


class TestWorkflowInvalidTransitions:
    """Test invalid workflow transitions return 400"""
    
    def test_invalid_transition_draft_to_approved(self, auth_headers):
        """Test that invalid transitions return 400 error"""
        # Create a new contract (starts as draft)
        file_content = b"Test contract for invalid transition."
        files = {
            'file': ('invalid_test.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {
            'title': f'TEST_Invalid_Transition_{uuid.uuid4().hex[:8]}',
            'counterparty': 'Invalid Test Corp',
            'contractType': 'General'
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers,
            files=files,
            data=data
        )
        assert create_response.status_code == 200
        contract_id = create_response.json()["id"]
        
        try:
            # Try to approve directly from draft (should fail)
            approve_response = requests.post(
                f"{BASE_URL}/api/contracts/{contract_id}/workflow/approve",
                headers=auth_headers
            )
            assert approve_response.status_code == 400, f"Expected 400, got {approve_response.status_code}"
            
            print(f"✓ Invalid transition correctly rejected with 400")
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/contracts/{contract_id}",
                headers=auth_headers
            )


class TestAuditLogs:
    """Audit logging endpoint tests"""
    
    def test_get_audit_logs(self, auth_headers):
        """Test GET /api/audit returns audit logs"""
        response = requests.get(
            f"{BASE_URL}/api/audit",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        
        # If there are logs, verify structure
        if len(data) > 0:
            log = data[0]
            assert "id" in log
            assert "action" in log
            assert "resourceType" in log
            assert "createdAt" in log
        
        print(f"✓ Audit logs: {len(data)} entries")
    
    def test_audit_logs_filter_by_resource_type(self, auth_headers):
        """Test audit logs can be filtered by resource type"""
        response = requests.get(
            f"{BASE_URL}/api/audit",
            headers=auth_headers,
            params={"resource_type": "contract"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned logs should be for contracts
        for log in data:
            assert log["resourceType"] == "contract"
        
        print(f"✓ Audit logs filtered by resource_type: {len(data)} entries")
    
    def test_contract_upload_creates_audit_log(self, auth_headers):
        """Test that contract upload creates an audit log entry"""
        # Get current audit log count
        before_response = requests.get(
            f"{BASE_URL}/api/audit",
            headers=auth_headers,
            params={"resource_type": "contract", "limit": 100}
        )
        before_count = len(before_response.json())
        
        # Upload a contract
        file_content = b"Test contract for audit logging."
        files = {
            'file': ('audit_test.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {
            'title': f'TEST_Audit_Contract_{uuid.uuid4().hex[:8]}',
            'counterparty': 'Audit Test Corp',
            'contractType': 'General'
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers,
            files=files,
            data=data
        )
        assert create_response.status_code == 200
        contract_id = create_response.json()["id"]
        
        try:
            # Wait a moment for audit log to be written
            time.sleep(0.5)
            
            # Check audit logs again
            after_response = requests.get(
                f"{BASE_URL}/api/audit",
                headers=auth_headers,
                params={"resource_type": "contract", "limit": 100}
            )
            after_count = len(after_response.json())
            
            assert after_count > before_count, "Audit log should have new entry after upload"
            
            # Check the latest log is for our upload
            latest_log = after_response.json()[0]
            assert latest_log["action"] == "contract_uploaded"
            
            print(f"✓ Contract upload created audit log entry")
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/contracts/{contract_id}",
                headers=auth_headers
            )
    
    def test_workflow_action_creates_audit_log(self, auth_headers):
        """Test that workflow actions create audit log entries"""
        # Create a contract
        file_content = b"Test contract for workflow audit."
        files = {
            'file': ('workflow_audit_test.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {
            'title': f'TEST_Workflow_Audit_{uuid.uuid4().hex[:8]}',
            'counterparty': 'Workflow Audit Corp',
            'contractType': 'General'
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers,
            files=files,
            data=data
        )
        assert create_response.status_code == 200
        contract_id = create_response.json()["id"]
        
        try:
            # Submit for review
            submit_response = requests.post(
                f"{BASE_URL}/api/contracts/{contract_id}/workflow/submit_for_review",
                headers=auth_headers
            )
            assert submit_response.status_code == 200
            
            # Wait for audit log
            time.sleep(0.5)
            
            # Check audit logs for workflow action
            audit_response = requests.get(
                f"{BASE_URL}/api/audit",
                headers=auth_headers,
                params={"resource_type": "contract", "limit": 10}
            )
            logs = audit_response.json()
            
            # Find the submit_for_review action
            workflow_logs = [l for l in logs if l["action"] == "contract_submit_for_review"]
            assert len(workflow_logs) > 0, "Should have audit log for workflow action"
            
            print(f"✓ Workflow action created audit log entry")
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/contracts/{contract_id}",
                headers=auth_headers
            )


class TestNotifications:
    """Notifications endpoint tests"""
    
    def test_get_notifications(self, auth_headers):
        """Test GET /api/notifications returns notifications list"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        
        # If there are notifications, verify structure
        if len(data) > 0:
            notif = data[0]
            assert "id" in notif
            assert "type" in notif
            assert "title" in notif
            assert "message" in notif
            assert "isRead" in notif
            assert "createdAt" in notif
        
        print(f"✓ Notifications: {len(data)} entries")
    
    def test_get_unread_count(self, auth_headers):
        """Test GET /api/notifications/unread-count returns count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "count" in data
        assert isinstance(data["count"], int)
        assert data["count"] >= 0
        
        print(f"✓ Unread notifications count: {data['count']}")
    
    def test_mark_all_read(self, auth_headers):
        """Test POST /api/notifications/read-all marks all as read"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/read-all",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        
        # Verify unread count is now 0
        count_response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers=auth_headers
        )
        assert count_response.json()["count"] == 0
        
        print(f"✓ Mark all notifications as read successful")


class TestRBAC:
    """Role-Based Access Control tests"""
    
    def test_admin_can_access_audit_logs(self, auth_headers):
        """Test that admin role can access audit logs"""
        # Test user has admin role
        response = requests.get(
            f"{BASE_URL}/api/audit",
            headers=auth_headers
        )
        # Admin should get 200 with data
        assert response.status_code == 200
        print(f"✓ Admin can access audit logs")
    
    def test_admin_can_perform_workflow_actions(self, auth_headers):
        """Test that admin role can perform all workflow actions"""
        # Create a contract
        file_content = b"Test contract for RBAC."
        files = {
            'file': ('rbac_test.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {
            'title': f'TEST_RBAC_Contract_{uuid.uuid4().hex[:8]}',
            'counterparty': 'RBAC Test Corp',
            'contractType': 'General'
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers,
            files=files,
            data=data
        )
        assert create_response.status_code == 200
        contract_id = create_response.json()["id"]
        
        try:
            # Admin should be able to submit for review
            submit_response = requests.post(
                f"{BASE_URL}/api/contracts/{contract_id}/workflow/submit_for_review",
                headers=auth_headers
            )
            assert submit_response.status_code == 200
            
            # Admin should be able to approve
            approve_response = requests.post(
                f"{BASE_URL}/api/contracts/{contract_id}/workflow/approve",
                headers=auth_headers
            )
            assert approve_response.status_code == 200
            
            # Admin should be able to activate
            activate_response = requests.post(
                f"{BASE_URL}/api/contracts/{contract_id}/workflow/activate",
                headers=auth_headers
            )
            assert activate_response.status_code == 200
            
            print(f"✓ Admin can perform all workflow actions")
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/contracts/{contract_id}",
                headers=auth_headers
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
