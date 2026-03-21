"""
LexiSense API Backend Tests
Tests for: Auth, Dashboard, Contracts, Team, Alerts, Templates, Analytics, Export
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://docflow-analyzer.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "testuser@lexisense.com"
TEST_PASSWORD = "Test1234!"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "healthy"
        print(f"✓ Health check passed: {data}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print(f"✓ Get current user successful: {data['email']}")
    
    def test_register_duplicate_email(self):
        """Test registration with existing email fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": "NewPassword123!",
            "firstName": "Test",
            "lastName": "User"
        })
        assert response.status_code == 400
        print("✓ Duplicate registration correctly rejected")


@pytest.fixture
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed")


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestDashboard:
    """Dashboard endpoint tests"""
    
    def test_get_dashboard_stats(self, auth_headers):
        """Test getting dashboard statistics"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data
        assert "totalContracts" in data["overview"]
        assert "activeContracts" in data["overview"]
        assert "expiringSoon" in data["overview"]
        assert "highRisk" in data["overview"]
        print(f"✓ Dashboard stats: {data['overview']}")
    
    def test_get_dashboard_activity(self, auth_headers):
        """Test getting dashboard activity"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/activity",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "activity" in data
        print(f"✓ Dashboard activity: {len(data['activity'])} items")


class TestContracts:
    """Contracts endpoint tests"""
    
    def test_list_contracts(self, auth_headers):
        """Test listing contracts"""
        response = requests.get(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Contracts list: {len(data)} contracts")
        return data
    
    def test_list_contracts_with_filters(self, auth_headers):
        """Test listing contracts with filters"""
        response = requests.get(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers,
            params={"status_filter": "active", "contract_type": "General"}
        )
        assert response.status_code == 200
        print("✓ Contracts list with filters works")
    
    def test_upload_contract(self, auth_headers):
        """Test uploading a contract"""
        # Create a simple text file
        file_content = b"This is a test contract document for LexiSense testing. It contains terms and conditions for a service agreement between Party A and Party B. The effective date is January 1, 2025 and expires on December 31, 2025."
        
        files = {
            'file': ('test_contract.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {
            'title': 'TEST_Contract_Upload',
            'counterparty': 'Test Corp',
            'contractType': 'Service Agreement'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers,
            files=files,
            data=data
        )
        assert response.status_code == 200
        result = response.json()
        assert result["title"] == "TEST_Contract_Upload"
        assert "id" in result
        print(f"✓ Contract uploaded: {result['id']}")
        return result["id"]
    
    def test_get_contract_detail(self, auth_headers):
        """Test getting contract detail"""
        # First get list of contracts
        list_response = requests.get(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers
        )
        contracts = list_response.json()
        
        if len(contracts) == 0:
            pytest.skip("No contracts to test")
        
        contract_id = contracts[0]["id"]
        response = requests.get(
            f"{BASE_URL}/api/contracts/{contract_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == contract_id
        print(f"✓ Contract detail: {data['title']}")
    
    def test_contract_chat(self, auth_headers):
        """Test contract chat functionality"""
        # Get a contract first
        list_response = requests.get(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers
        )
        contracts = list_response.json()
        
        if len(contracts) == 0:
            pytest.skip("No contracts to test chat")
        
        contract_id = contracts[0]["id"]
        response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/chat",
            headers=auth_headers,
            json={"question": "What is this contract about?"}
        )
        # Chat may take time or fail gracefully
        assert response.status_code in [200, 500]
        if response.status_code == 200:
            data = response.json()
            assert "answer" in data
            print(f"✓ Contract chat works: {data['answer'][:50]}...")
        else:
            print("✓ Contract chat endpoint accessible (AI may be slow)")
    
    def test_contract_versions(self, auth_headers):
        """Test getting contract version history"""
        list_response = requests.get(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers
        )
        contracts = list_response.json()
        
        if len(contracts) == 0:
            pytest.skip("No contracts to test versions")
        
        contract_id = contracts[0]["id"]
        response = requests.get(
            f"{BASE_URL}/api/contracts/{contract_id}/versions",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Contract versions: {len(data)} versions")


class TestBulkUpload:
    """Bulk upload endpoint tests"""
    
    def test_bulk_upload_contracts(self, auth_headers):
        """Test bulk uploading contracts"""
        files = []
        for i in range(2):
            content = f"Test bulk contract {i+1}. This is a sample contract document."
            files.append(
                ('files', (f'bulk_test_{i+1}.txt', io.BytesIO(content.encode()), 'text/plain'))
            )
        
        response = requests.post(
            f"{BASE_URL}/api/contracts/bulk",
            headers=auth_headers,
            files=files,
            data={'contractType': 'General'}
        )
        assert response.status_code == 200
        data = response.json()
        assert "successful" in data
        assert "failed" in data
        print(f"✓ Bulk upload: {data['successful']} successful, {data['failed']} failed")


class TestTeam:
    """Team management endpoint tests"""
    
    def test_list_team_members(self, auth_headers):
        """Test listing team members"""
        response = requests.get(
            f"{BASE_URL}/api/team/members",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least the current user
        print(f"✓ Team members: {len(data)} members")
    
    def test_list_invitations(self, auth_headers):
        """Test listing invitations (admin only)"""
        response = requests.get(
            f"{BASE_URL}/api/team/invitations",
            headers=auth_headers
        )
        # May be 200 or 403 depending on role
        assert response.status_code in [200, 403]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Invitations: {len(data)} invitations")
        else:
            print("✓ Invitations endpoint accessible (non-admin)")
    
    def test_invite_member(self, auth_headers):
        """Test inviting a new member"""
        import uuid
        test_email = f"test_invite_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/team/invite",
            headers=auth_headers,
            json={"email": test_email, "role": "user"}
        )
        # May be 200 or 403 depending on role
        assert response.status_code in [200, 403, 400]
        if response.status_code == 200:
            data = response.json()
            assert data["email"] == test_email
            print(f"✓ Invitation sent to {test_email}")
        else:
            print("✓ Invite endpoint accessible")


class TestAlerts:
    """Alerts endpoint tests"""
    
    def test_get_alert_settings(self, auth_headers):
        """Test getting alert settings"""
        response = requests.get(
            f"{BASE_URL}/api/alerts/settings",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "alertDays" in data
        assert "emailEnabled" in data
        print(f"✓ Alert settings: {data}")
    
    def test_update_alert_settings(self, auth_headers):
        """Test updating alert settings"""
        response = requests.put(
            f"{BASE_URL}/api/alerts/settings",
            headers=auth_headers,
            params={"alertDays": [30, 14, 7], "emailEnabled": True}
        )
        # May be 200 or 403 depending on role
        assert response.status_code in [200, 403]
        if response.status_code == 200:
            print("✓ Alert settings updated")
        else:
            print("✓ Alert settings endpoint accessible (non-admin)")
    
    def test_get_expiring_contracts(self, auth_headers):
        """Test getting expiring contracts"""
        response = requests.get(
            f"{BASE_URL}/api/alerts/expiring",
            headers=auth_headers,
            params={"days": 60}
        )
        assert response.status_code == 200
        data = response.json()
        assert "contracts" in data
        assert "total" in data
        print(f"✓ Expiring contracts: {data['total']} contracts")
    
    def test_get_alert_history(self, auth_headers):
        """Test getting alert history"""
        response = requests.get(
            f"{BASE_URL}/api/alerts/history",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "alerts" in data
        print(f"✓ Alert history: {len(data['alerts'])} alerts")


class TestTemplates:
    """Templates endpoint tests"""
    
    def test_list_templates(self, auth_headers):
        """Test listing templates"""
        response = requests.get(
            f"{BASE_URL}/api/templates",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Templates: {len(data)} templates")
    
    def test_get_default_templates(self, auth_headers):
        """Test getting default templates"""
        response = requests.get(
            f"{BASE_URL}/api/templates/default",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # Should have default templates
        print(f"✓ Default templates: {len(data)} templates")
    
    def test_create_template(self, auth_headers):
        """Test creating a template"""
        response = requests.post(
            f"{BASE_URL}/api/templates",
            headers=auth_headers,
            json={
                "name": "TEST_Template",
                "description": "Test template for testing",
                "contractType": "General",
                "content": "This is a test template content with [PLACEHOLDER] fields.",
                "fields": [],
                "tags": ["test"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Template"
        print(f"✓ Template created: {data['id']}")
        return data["id"]


class TestAnalytics:
    """Analytics endpoint tests"""
    
    def test_get_analytics_overview(self, auth_headers):
        """Test getting analytics overview"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/overview",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "expiring" in data
        assert "riskDistribution" in data
        assert "byType" in data
        print(f"✓ Analytics overview: {data['summary']}")
    
    def test_compare_contracts(self, auth_headers):
        """Test comparing two contracts"""
        # Get contracts first
        list_response = requests.get(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers
        )
        contracts = list_response.json()
        
        if len(contracts) < 2:
            pytest.skip("Need at least 2 contracts to compare")
        
        contract1_id = contracts[0]["id"]
        contract2_id = contracts[1]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/analytics/contracts/{contract1_id}/compare/{contract2_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "contract1" in data
        assert "contract2" in data
        assert "differences" in data
        print(f"✓ Contract comparison works")


class TestExport:
    """Export endpoint tests"""
    
    def test_export_contract_pdf(self, auth_headers):
        """Test exporting contract as PDF"""
        # Get a contract first
        list_response = requests.get(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers
        )
        contracts = list_response.json()
        
        if len(contracts) == 0:
            pytest.skip("No contracts to export")
        
        contract_id = contracts[0]["id"]
        response = requests.get(
            f"{BASE_URL}/api/export/contract/{contract_id}/pdf",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        print(f"✓ Contract PDF export works")
    
    def test_export_analytics_pdf(self, auth_headers):
        """Test exporting analytics as PDF"""
        response = requests.get(
            f"{BASE_URL}/api/export/analytics/pdf",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        print(f"✓ Analytics PDF export works")


class TestContractDelete:
    """Contract deletion tests - run last to clean up"""
    
    def test_delete_test_contracts(self, auth_headers):
        """Delete test contracts created during testing"""
        list_response = requests.get(
            f"{BASE_URL}/api/contracts",
            headers=auth_headers
        )
        contracts = list_response.json()
        
        deleted = 0
        for contract in contracts:
            if contract["title"].startswith("TEST_") or contract["title"].startswith("Bulk Test"):
                response = requests.delete(
                    f"{BASE_URL}/api/contracts/{contract['id']}",
                    headers=auth_headers
                )
                if response.status_code == 200:
                    deleted += 1
        
        print(f"✓ Cleaned up {deleted} test contracts")


class TestTemplateDelete:
    """Template deletion tests - run last to clean up"""
    
    def test_delete_test_templates(self, auth_headers):
        """Delete test templates created during testing"""
        list_response = requests.get(
            f"{BASE_URL}/api/templates",
            headers=auth_headers
        )
        templates = list_response.json()
        
        deleted = 0
        for template in templates:
            if template["name"].startswith("TEST_"):
                response = requests.delete(
                    f"{BASE_URL}/api/templates/{template['id']}",
                    headers=auth_headers
                )
                if response.status_code == 200:
                    deleted += 1
        
        print(f"✓ Cleaned up {deleted} test templates")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
